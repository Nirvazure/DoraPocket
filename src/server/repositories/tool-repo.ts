import 'server-only'

import type * as Prisma from '../../generated/prisma/internal/prismaNamespace'
import { prisma } from '@/server/db/prisma'
import { TOOL_REGISTRY, type ToolItem } from '@/shared/tool-registry'

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined
  return value as Prisma.InputJsonValue
}

function toToolCreateInput(tool: ToolItem, ownerUserId?: string | null) {
  return {
    id: tool.id,
    name: tool.name,
    icon: tool.icon,
    iconType: tool.iconType ?? null,
    iconText: tool.iconText ?? null,
    iconImageUrl: tool.iconImageUrl ?? null,
    iconImageLocalPath: tool.iconImageLocalPath ?? null,
    url: tool.url ?? null,
    description: tool.description,
    category: tool.category,
    tags: tool.tags,
    source: tool.source,
    status: tool.status,
    executionMode: tool.executionMode,
    pricingModel: tool.pricingModel,
    requiresAuth: tool.requiresAuth,
    platform: tool.platform,
    capabilities: tool.capabilities,
    recommendedFor: tool.recommendedFor,
    sourceNote: tool.sourceNote ?? null,
    trustSignals: tool.trustSignals,
    subscriptionSupport: tool.subscriptionSupport,
    defaultArgs: toJsonValue(tool.defaultArgs),
    isBuiltin: Boolean(tool.isBuiltin),
    siteHostname: tool.siteHostname ?? null,
    marketAssetOrigin: tool.marketAssetOrigin ?? null,
    seedSource: tool.source === 'submitted' ? 'user_submission' : 'system_seed',
    createdByUserId: ownerUserId ?? null,
  }
}

export async function listActiveTools() {
  return prisma.tool.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'asc' },
  })
}

export async function findToolById(toolId: string) {
  return prisma.tool.findUnique({ where: { id: toolId } })
}

export async function upsertSeedTools(ownerUserId?: string | null) {
  for (const tool of TOOL_REGISTRY) {
    const input = toToolCreateInput(tool, ownerUserId)
    await prisma.tool.upsert({
      where: { id: tool.id },
      create: input,
      update: input,
    })
  }
}
