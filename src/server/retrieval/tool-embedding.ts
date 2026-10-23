import { QWEN_BASE_URL } from '@/constant'
import { prisma } from '@/server/db/prisma'
import { getExtensionSchema } from '@/server/db/extensions'
import { updateToolIndex } from '@/server/repositories/tool-repo'
import { EMBEDDING_CONFIG, type EmbeddingConfig } from '@/shared/market/tool-index-content'

type PreparedIndex = {
  content: string
  contentHash: string
  embeddingModel: string | null
  embeddedAt: Date | null
}
type EmbeddingDeps = {
  config: EmbeddingConfig
  prepare: (toolId: string) => Promise<PreparedIndex | null>
  embed: (text: string, config: EmbeddingConfig) => Promise<number[] | null>
  write: (toolId: string, hash: string, model: string, embedding: number[]) => Promise<boolean>
}

export function validateEmbedding(embedding: number[]): void {
  if (embedding.length !== 1024 || embedding.some((value) => !Number.isFinite(value)))
    throw new Error('Embedding must contain 1024 finite numbers')
}

async function embedText(
  text: string,
  config: EmbeddingConfig = EMBEDDING_CONFIG,
): Promise<number[] | null> {
  const apiKey = process.env.QWEN_API_KEY?.trim()
  if (!apiKey) throw new Error('QWEN_API_KEY is required')
  const response = await fetch(`${QWEN_BASE_URL}/embeddings`, {
    method: 'POST',
    signal: AbortSignal.timeout(30_000),
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      input: text,
      dimensions: config.dimensions,
      encoding_format: 'float',
    }),
  })
  if (!response.ok) throw new Error(`Embedding provider returned HTTP ${response.status}`)
  const payload = (await response.json()) as { data?: Array<{ embedding?: number[] }> }
  const embedding = payload.data?.[0]?.embedding
  if (!Array.isArray(embedding)) throw new Error('Embedding provider response has no vector')
  validateEmbedding(embedding)
  return embedding
}

async function prepareToolIndex(toolId: string): Promise<PreparedIndex | null> {
  return prisma.$transaction(async (tx) => {
    // Serialize index refresh with a concurrent catalog upsert before reading content.
    await tx.$queryRawUnsafe(
      'SELECT "id" FROM dorapocket."Tool" WHERE "id" = $1 FOR UPDATE',
      toolId,
    )
    const tool = await tx.tool.findUnique({ where: { id: toolId } })
    if (!tool || tool.status !== 'active') return null
    await updateToolIndex(tx, tool)
    return tx.toolIndex.findUnique({
      where: { toolId },
      select: { content: true, contentHash: true, embeddingModel: true, embeddedAt: true },
    })
  })
}

export async function writeToolEmbedding(
  toolId: string,
  hash: string,
  model: string,
  embedding: number[],
): Promise<boolean> {
  validateEmbedding(embedding)
  // A deployment may change model while a request is in flight.
  if (EMBEDDING_CONFIG.model !== model) return false
  const schema = await getExtensionSchema('vector')
  return (
    (await prisma.$executeRawUnsafe(
      `UPDATE dorapocket."ToolIndex" AS i
     SET "embedding" = $1::${schema}.vector, "embeddingModel" = $2, "embeddedAt" = NOW()
     FROM dorapocket."Tool" AS t
     WHERE i."toolId" = $4 AND t."id" = i."toolId" AND t."status" = 'active'
       AND i."contentHash" = $3`,
      `[${embedding.join(',')}]`,
      model,
      hash,
      toolId,
    )) > 0
  )
}

export async function syncToolEmbedding(
  toolId: string,
  deps: Partial<EmbeddingDeps> = {},
): Promise<void> {
  const config = deps.config ?? EMBEDDING_CONFIG
  if (config.dimensions !== 1024) throw new Error('Embedding dimension must be 1024')
  const index = await (deps.prepare ?? prepareToolIndex)(toolId)
  if (!index || (index.embeddedAt && index.embeddingModel === config.model)) return
  const embedding = await (deps.embed ?? embedText)(index.content, config)
  if (!embedding) return
  validateEmbedding(embedding)
  await (deps.write ?? writeToolEmbedding)(toolId, index.contentHash, config.model, embedding)
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
  validateEmbedding(queryEmbedding)
  const schema = await getExtensionSchema('vector')
  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; similarity: number }>>(
    `SELECT t."id", 1 - (i."embedding" OPERATOR(${schema}.<=>) $1::${schema}.vector) AS similarity
     FROM dorapocket."Tool" t JOIN dorapocket."ToolIndex" i ON i."toolId" = t."id"
     WHERE t."status" = 'active' AND i."embedding" IS NOT NULL AND i."embeddingModel" = $3
     ORDER BY i."embedding" OPERATOR(${schema}.<=>) $1::${schema}.vector LIMIT $2`,
    `[${queryEmbedding.join(',')}]`,
    limit,
    EMBEDDING_CONFIG.model,
  )
  return new Map(rows.map((row) => [row.id, Number(row.similarity)]))
}
