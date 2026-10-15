import 'server-only'

import { createHash } from 'node:crypto'
import { prisma } from '@/server/db/prisma'
import type { Prisma } from '@/generated/prisma/client'
import { buildToolIndex, type ToolIndexFields } from '@/shared/market/tool-index-content'
import type { ToolCategory, ToolPlatform, ToolPricingModel } from '@/shared/market/tool-registry'
import { assertOwnedToolDeletable } from '@/shared/market/owned-tool-delete'

export type ImportedToolInput = {
  name: string
  url: string
  description: string
  category: ToolCategory
  tags: string[]
  iconUrl?: string | null
  pricingModel?: ToolPricingModel
  requiresAuth?: boolean | null
  platform?: ToolPlatform
  createdByUserId?: string | null
}

export function createImportedToolId(url: string): string {
  const hash = createHash('sha1').update(url.trim().toLowerCase()).digest('hex').slice(0, 14)
  return `tool_${hash}`
}

// Called inside the same transaction as catalog writes. An unchanged hash preserves vectors.
export async function updateToolIndex(
  tx: Prisma.TransactionClient,
  tool: ToolIndexFields & { id: string },
) {
  const index = buildToolIndex(tool)
  await tx.$executeRawUnsafe(
    `INSERT INTO dorapocket."ToolIndex" ("toolId", "content", "contentHash") VALUES ($1, $2, $3)
     ON CONFLICT ("toolId") DO UPDATE SET "content" = EXCLUDED."content", "contentHash" = EXCLUDED."contentHash",
       "embedding" = NULL, "embeddingModel" = NULL, "embeddedAt" = NULL
     WHERE dorapocket."ToolIndex"."contentHash" IS DISTINCT FROM EXCLUDED."contentHash"`,
    tool.id,
    index.content,
    index.contentHash,
  )
  return index
}

export async function upsertImportedTool(input: ImportedToolInput) {
  const url = input.url.trim()
  const parsedUrl = new URL(url)
  if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.hostname)
    throw new Error('Tool URL must use http or https')
  const id = createImportedToolId(url)
  const data = {
    name: input.name.trim(),
    url,
    description: input.description.trim(),
    category: input.category,
    tags: [...new Set(input.tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 8),
    status: 'active',
    pricingModel: input.pricingModel ?? 'unknown',
    requiresAuth: input.requiresAuth ?? null,
    platform: input.platform ?? 'unknown',
  }
  return prisma.$transaction(async (tx) => {
    const tool = await tx.tool.upsert({
      where: { id },
      create: {
        id,
        ...data,
        iconUrl: input.iconUrl ?? null,
        createdByUserId: input.createdByUserId ?? null,
      },
      update: { ...data, ...(input.iconUrl !== undefined ? { iconUrl: input.iconUrl } : {}) },
    })
    await updateToolIndex(tx, tool)
    return tool
  })
}

export async function listActiveTools() {
  return prisma.tool.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'asc' },
    include: {
      marketFeedback: { select: { vote: true } },
      toolActivities: { select: { saves: true, opens: true } },
    },
  })
}

export async function findToolById(toolId: string) {
  return prisma.tool.findUnique({ where: { id: toolId } })
}

export async function deleteOwnedTool(userId: string, toolId: string) {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: { id: true, createdByUserId: true },
  })
  assertOwnedToolDeletable({ tool, userId })
  return prisma.tool.delete({ where: { id: toolId } })
}
