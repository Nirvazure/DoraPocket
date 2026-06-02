import { createHash } from 'node:crypto'

import { QWEN_BASE_URL } from '@/constant'
import { prisma } from '@/server/db/prisma'

const EMBEDDING_MODEL = 'text-embedding-v3'
const EMBEDDING_DIM = 1024

type ToolEmbedFields = {
  name: string
  description: string
  category: string
  tags: string[]
  capabilities: string[]
  recommendedFor: string[]
}

function buildEmbeddingText(tool: ToolEmbedFields): string {
  return [
    tool.name,
    tool.description,
    `分类: ${tool.category}`,
    `标签: ${tool.tags.join('、')}`,
    `能力: ${tool.capabilities.join('、')}`,
    `适用于: ${tool.recommendedFor.join('、')}`,
  ].join('\n')
}

function contentHash(tool: ToolEmbedFields): string {
  return createHash('sha256').update(buildEmbeddingText(tool)).digest('hex')
}

async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.QWEN_API_KEY?.trim()
  if (!apiKey) return null

  const response = await fetch(`${QWEN_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.QWEN_EMBEDDING_MODEL?.trim() || EMBEDDING_MODEL,
      input: text,
      dimensions: Number(process.env.QWEN_EMBEDDING_DIMENSIONS ?? EMBEDDING_DIM),
      encoding_format: 'float',
    }),
  })

  if (!response.ok) return null

  const payload = (await response.json()) as { data?: Array<{ embedding: number[] }> }
  return payload.data?.[0]?.embedding ?? null
}

export async function syncToolEmbedding(toolId: string): Promise<void> {
  try {
    const tool = await prisma.tool.findUnique({ where: { id: toolId } })
    if (!tool || tool.status !== 'active') return

    const fields: ToolEmbedFields = {
      name: tool.name,
      description: tool.description,
      category: tool.category,
      tags: tool.tags,
      capabilities: tool.capabilities,
      recommendedFor: tool.recommendedFor,
    }
    const hash = contentHash(fields)
    if (tool.embeddingContentHash === hash && tool.embeddedAt) return

    const embedding = await embedText(buildEmbeddingText(fields))
    if (!embedding) return

    await prisma.$executeRawUnsafe(
      `UPDATE "Tool"
       SET "embedding" = $1::vector,
           "embeddingModel" = $2,
           "embeddingContentHash" = $3,
           "embeddedAt" = NOW()
       WHERE "id" = $4`,
      `[${embedding.join(',')}]`,
      process.env.QWEN_EMBEDDING_MODEL?.trim() || EMBEDDING_MODEL,
      hash,
      toolId,
    )
  } catch (error) {
    console.error('[syncToolEmbedding]', toolId, error)
  }
}

export async function embedQuery(text: string): Promise<number[] | null> {
  try {
    return await embedText(text)
  } catch {
    return null
  }
}

export async function searchToolsByEmbedding(
  queryEmbedding: number[],
  limit: number,
): Promise<Map<string, number>> {
  const vector = `[${queryEmbedding.join(',')}]`

  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; similarity: number }>>(
    `SELECT "id", 1 - ("embedding" <=> $1::vector) AS similarity
     FROM "Tool"
     WHERE "status" = 'active' AND "embedding" IS NOT NULL
     ORDER BY "embedding" <=> $1::vector
     LIMIT $2`,
    vector,
    limit,
  )

  return new Map(rows.map((row) => [row.id, Number(row.similarity)]))
}
