import { z } from 'zod'

export type ToolCategory =
  | 'ai_assistant'
  | 'search'
  | 'developer'
  | 'design'
  | 'productivity'
  | 'media'
  | 'learning'
  | 'writing'

export type ToolSource = 'market' | 'submitted' | 'external_resource' | 'official'
export type ToolStatus = 'active' | 'review' | 'blocked'
export type ToolExecutionMode = 'native_card' | 'external_link' | 'workflow' | 'reference_only'
export type ToolPlatform = 'web' | 'desktop' | 'mobile' | 'api' | 'mixed'
export type ToolPricingModel = 'free' | 'freemium' | 'paid' | 'subscription'

export type ToolTrustSignals = {
  curated: boolean
  official: boolean
  communityVerified: boolean
  riskNote?: string
}

export type ToolRatingSummary = {
  upvotes: number
  downvotes: number
  score: number
}

export type ToolUsageStats = {
  saves: number
  opens: number
  subscriptions: number
}

export type ToolItem = {
  id: string
  name: string
  icon: string
  iconType?: 'emoji' | 'favicon'
  iconText?: string
  iconImageUrl?: string | null
  url: string | null
  description: string
  category: ToolCategory
  tags: string[]
  source: ToolSource
  status: ToolStatus
  executionMode: ToolExecutionMode
  pricingModel: ToolPricingModel
  requiresAuth: boolean
  platform: ToolPlatform
  capabilities: string[]
  recommendedFor: string[]
  sourceNote?: string
  trustSignals: ToolTrustSignals
  ratingSummary: ToolRatingSummary
  usageStats: ToolUsageStats
  subscriptionSupport: boolean
  defaultArgs?: Record<string, unknown>
  siteHostname?: string
  marketAssetOrigin?: 'registry' | 'bookmark_seed' | 'community'
}

export type ToolMeta = {
  toolId: string
  name: string
  description: string
  inputSchema: z.ZodType<Record<string, unknown>>
}

export type ToolMatch = {
  tool: ToolItem
  score: number
  reason: string
  sourceLabel: 'pocket' | 'market'
}

/** 演示评价 seed 等引用的市场工具 id。 */
export const TOOL_ID_GEMINI = 'gemini' as const
export const TOOL_ID_PERPLEXITY = 'perplexity' as const
export const TOOL_ID_PDF24 = 'pdf24' as const
export const TOOL_ID_REGEX101 = 'regex101' as const
export const TOOL_ID_REMOVE_BG = 'remove_bg' as const
export const TOOL_ID_MESHY = 'meshy' as const
export const TOOL_ID_CARBON = 'carbon' as const
export const TOOL_ID_FLATICON = 'flaticon' as const
export const TOOL_ID_LANGGRAPH_CN = 'langgraph_cn' as const
export const TOOL_ID_PROFILE_README = 'profile_readme_generator' as const
export const TOOL_ID_KIMI = 'kimi' as const
export const TOOL_ID_FANYI = 'fanyi_baidu' as const

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword))
}

function inferReason(query: string, tool: ToolItem): string {
  if (tool.category === 'search') return `它更适合先扩展信息面，再继续决策。`
  if (tool.category === 'developer') return `它针对开发任务更专用，能减少你手工折腾。`
  if (tool.category === 'design') return `它更像高频素材或设计工具，适合当前任务。`
  return `它与“${query}”的标签和场景匹配度较高。`
}

export function scoreToolMatch(query: string, tool: ToolItem): number {
  const lower = query.trim().toLowerCase()
  if (!lower) return 0

  let score = 0
  if (tool.name.toLowerCase().includes(lower)) score += 80
  if (tool.description.toLowerCase().includes(lower)) score += 32

  for (const tag of tool.tags) {
    if (lower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(lower)) score += 22
  }

  for (const capability of tool.capabilities) {
    if (lower.includes(capability.toLowerCase())) score += 18
  }

  if (includesAny(lower, ['搜索', '调研', '资料']) && tool.id === TOOL_ID_PERPLEXITY) score += 58
  if (includesAny(lower, ['翻译', '中译英', '英译中']) && tool.id === TOOL_ID_FANYI) score += 58
  if (includesAny(lower, ['pdf', '合并', '压缩', '拆分']) && tool.id === TOOL_ID_PDF24) score += 58
  if (includesAny(lower, ['正则', 'regex']) && tool.id === TOOL_ID_REGEX101) score += 58
  if (includesAny(lower, ['抠图', '去背景']) && tool.id === TOOL_ID_REMOVE_BG) score += 58
  if (includesAny(lower, ['3d', '模型', 'mesh']) && tool.id === TOOL_ID_MESHY) score += 58
  if (includesAny(lower, ['代码截图', '代码图片']) && tool.id === TOOL_ID_CARBON) score += 58
  if (includesAny(lower, ['图标', 'icon']) && tool.id === TOOL_ID_FLATICON) score += 58
  if (includesAny(lower, ['长文', '总结', '长上下文']) && tool.id === TOOL_ID_KIMI) score += 52

  if (tool.executionMode === 'external_link') score += 4
  return score
}

export function rankToolItems(
  tools: ToolItem[],
  query: string,
  opts?: {
    savedToolIds?: string[]
    subscribedToolIds?: string[]
    upvotedToolIds?: string[]
    downvotedToolIds?: string[]
    preferredCategories?: string[]
    preferredTags?: string[]
    preferredPlatforms?: string[]
    preferredPricing?: string[]
    preferredExecutionModes?: string[]
    avoidAuthWall?: boolean
    prefersSubscriptionTools?: boolean
    includeToolIds?: Set<string>
    vectorSimilarity?: Map<string, number>
    vectorBoost?: number
  },
): ToolMatch[] {
  const saved = new Set(opts?.savedToolIds ?? [])
  const subscribed = new Set(opts?.subscribedToolIds ?? [])
  const upvoted = new Set(opts?.upvotedToolIds ?? [])
  const downvoted = new Set(opts?.downvotedToolIds ?? [])
  const preferredCategories = new Set(opts?.preferredCategories ?? [])
  const preferredTags = new Set(opts?.preferredTags ?? [])
  const preferredPlatforms = new Set(opts?.preferredPlatforms ?? [])
  const preferredPricing = new Set(opts?.preferredPricing ?? [])
  const preferredExecutionModes = new Set(opts?.preferredExecutionModes ?? [])
  const includeToolIds = opts?.includeToolIds
  const vectorSimilarity = opts?.vectorSimilarity
  const vectorBoost = opts?.vectorBoost ?? 0

  return tools
    .filter((tool) => tool.status === 'active')
    .map((tool) => {
      let score = scoreToolMatch(query, tool)
      let sourceLabel: ToolMatch['sourceLabel'] = 'market'
      if (saved.has(tool.id)) {
        score += 26
        sourceLabel = 'pocket'
      }
      if (subscribed.has(tool.id)) score += 16
      if (upvoted.has(tool.id)) score += 12
      if (downvoted.has(tool.id)) score -= 18
      if (preferredCategories.has(tool.category)) score += 14
      if (preferredPlatforms.has(tool.platform)) score += 8
      if (preferredPricing.has(tool.pricingModel)) score += 8
      if (preferredExecutionModes.has(tool.executionMode)) score += 8
      if (tool.tags.some((tag) => preferredTags.has(tag))) score += 12
      if (opts?.avoidAuthWall && !tool.requiresAuth) score += 6
      if (opts?.prefersSubscriptionTools && tool.subscriptionSupport) score += 6
      score += Math.max(0, tool.ratingSummary.score)
      const similarity = vectorSimilarity?.get(tool.id)
      if (similarity != null) score += similarity * vectorBoost
      return {
        tool,
        score,
        reason: inferReason(query, tool),
        sourceLabel,
      }
    })
    .filter((item) => {
      if (!includeToolIds) return item.score > 0
      if (!includeToolIds.has(item.tool.id)) return false
      return scoreToolMatch(query, item.tool) > 0 || vectorSimilarity?.has(item.tool.id) === true
    })
    .sort((a, b) => b.score - a.score)
}
