import 'server-only'

import { createHash } from 'node:crypto'
import { prisma } from '@/server/db/prisma'
import { isSupabaseMarketAssetUrl } from '@/shared/market/market-asset-url'
import {
  type ToolCategory,
  type ToolExecutionMode,
  type ToolPlatform,
  type ToolPricingModel,
} from '@/shared/market/tool-registry'

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
      .slice(0, 5) ?? [`需要 ${input.name.trim()} 相关能力`],
    sourceNote: input.sourceNote ?? '用户提交',
    trustSignals: {
      curated: false,
      official: false,
      communityVerified: false,
    },
    subscriptionSupport: false,
    defaultArgs: undefined,
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
