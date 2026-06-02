import 'server-only'

import { createHash } from 'node:crypto'
import type * as Prisma from '../../generated/prisma/internal/prismaNamespace'
import { prisma } from '@/server/db/prisma'
import { isSupabaseMarketAssetUrl } from '@/shared/market-asset-url'
import {
  BUILTIN_TOOL_REGISTRY,
  type ToolCategory,
  type ToolExecutionMode,
  type ToolItem,
  type ToolPlatform,
  type ToolPricingModel,
} from '@/shared/tool-registry'

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
    iconImageLocalPath: null,
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

export type ImportedToolInput = {
  name: string
  url: string
  description: string
  category: ToolCategory
  tags: string[]
  executionMode?: ToolExecutionMode
  pricingModel?: ToolPricingModel
  requiresAuth?: boolean
  platform?: ToolPlatform
  capabilities?: string[]
  recommendedFor?: string[]
  sourceNote?: string
  siteHostname?: string
  createdByUserId?: string | null
}

function withoutIconFields<T extends Record<string, unknown>>(input: T) {
  const copy = { ...input }
  delete copy.icon
  delete copy.iconType
  delete copy.iconText
  delete copy.iconImageUrl
  delete copy.iconImageLocalPath
  return copy
}

function normalizeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export function createImportedToolId(url: string): string {
  const hash = createHash('sha1').update(url.trim().toLowerCase()).digest('hex').slice(0, 14)
  return `tool_${hash}`
}

export async function upsertImportedTool(input: ImportedToolInput) {
  const url = input.url.trim()
  const hostname = input.siteHostname ?? normalizeHostname(url)
  const id = createImportedToolId(url)
  const data = {
    id,
    name: input.name.trim(),
    icon: '🌐',
    iconType: 'emoji',
    iconText: '🌐',
    iconImageUrl: null as string | null,
    iconImageLocalPath: null,
    url,
    description: input.description.trim(),
    category: input.category,
    tags: input.tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8),
    source: 'submitted',
    status: 'active',
    executionMode: input.executionMode ?? 'external_link',
    pricingModel: input.pricingModel ?? 'freemium',
    requiresAuth: input.requiresAuth ?? false,
    platform: input.platform ?? 'web',
    capabilities:
      input.capabilities
        ?.map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8) ??
      input.tags
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 5),
    recommendedFor: input.recommendedFor
      ?.map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5) ?? [`需要${input.name.trim()}相关能力`],
    sourceNote: input.sourceNote ?? '用户提交',
    trustSignals: {
      curated: false,
      official: false,
      communityVerified: false,
    },
    subscriptionSupport: false,
    defaultArgs: undefined,
    isBuiltin: false,
    siteHostname: hostname,
    marketAssetOrigin: 'community',
    seedSource: 'community_submission',
    createdByUserId: input.createdByUserId ?? null,
  }

  const existing = await prisma.tool.findUnique({
    where: { id },
    select: { iconImageUrl: true, iconType: true, iconText: true, icon: true },
  })

  const updateData = { ...data }
  if (existing && isSupabaseMarketAssetUrl(existing.iconImageUrl)) {
    updateData.icon = existing.icon ?? updateData.icon
    updateData.iconType = existing.iconType ?? updateData.iconType
    updateData.iconText = existing.iconText ?? updateData.iconText
    updateData.iconImageUrl = existing.iconImageUrl
    updateData.iconImageLocalPath = null
  }

  const tool = await prisma.tool.upsert({
    where: { id },
    create: data,
    update: updateData,
  })
  return tool
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
  for (const tool of BUILTIN_TOOL_REGISTRY) {
    const input = toToolCreateInput(tool, ownerUserId)
    await prisma.tool.upsert({
      where: { id: tool.id },
      create: input,
      update: withoutIconFields(input),
    })
  }
}
