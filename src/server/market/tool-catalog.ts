import 'server-only'

import type { ToolModel as DbTool } from '../../generated/prisma/models/Tool'
import { listActiveTools } from '@/server/repositories/tool-repo'
import type {
  ToolItem,
  ToolRatingSummary,
  ToolTrustSignals,
  ToolUsageStats,
} from '@/shared/tool-registry'
import { filterToolsByBuiltinAvailability as filterVisibleTools } from '@/shared/tool-registry'

function defaultRatingSummary(): ToolRatingSummary {
  return {
    upvotes: 0,
    downvotes: 0,
    score: 0,
  }
}

function defaultUsageStats(): ToolUsageStats {
  return {
    saves: 0,
    opens: 0,
    subscriptions: 0,
  }
}

function toToolTrustSignals(value: unknown): ToolTrustSignals {
  const raw = value && typeof value === 'object' ? (value as Partial<ToolTrustSignals>) : {}
  return {
    curated: raw.curated !== false,
    official: raw.official === true,
    communityVerified: raw.communityVerified === true,
    riskNote: typeof raw.riskNote === 'string' ? raw.riskNote : undefined,
  }
}

function toDefaultArgs(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export function mapDbToolToToolItem(tool: DbTool): ToolItem {
  return {
    id: tool.id,
    name: tool.name,
    icon: tool.icon,
    iconType: (tool.iconType as ToolItem['iconType']) ?? undefined,
    iconText: tool.iconText ?? undefined,
    iconImageUrl: tool.iconImageUrl ?? null,
    iconImageLocalPath: tool.iconImageLocalPath ?? null,
    url: tool.url ?? null,
    description: tool.description,
    category: tool.category as ToolItem['category'],
    tags: tool.tags,
    source: tool.source as ToolItem['source'],
    status: tool.status as ToolItem['status'],
    executionMode: tool.executionMode as ToolItem['executionMode'],
    pricingModel: tool.pricingModel as ToolItem['pricingModel'],
    requiresAuth: tool.requiresAuth,
    platform: tool.platform as ToolItem['platform'],
    capabilities: tool.capabilities,
    recommendedFor: tool.recommendedFor,
    sourceNote: tool.sourceNote ?? undefined,
    trustSignals: toToolTrustSignals(tool.trustSignals),
    ratingSummary: defaultRatingSummary(),
    usageStats: defaultUsageStats(),
    subscriptionSupport: tool.subscriptionSupport,
    defaultArgs: toDefaultArgs(tool.defaultArgs),
    isBuiltin: tool.isBuiltin,
    siteHostname: tool.siteHostname ?? undefined,
    marketAssetOrigin: (tool.marketAssetOrigin as ToolItem['marketAssetOrigin']) ?? undefined,
  }
}

export async function listActiveToolItems(builtinToolsEnabled = true) {
  const tools = await listActiveTools()
  return filterVisibleTools(tools.map(mapDbToolToToolItem), builtinToolsEnabled)
}
