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

export type ToolSource = 'builtin' | 'market' | 'submitted' | 'external_resource' | 'official'
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
  isBuiltin?: boolean
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
  sourceLabel: 'builtin' | 'pocket' | 'market'
}

export const BUILTIN_ANSWER_BOOK_TOOL_ID = 'builtin_answer_book' as const
export const BUILTIN_ANYWHERE_DOOR_TOOL_ID = 'builtin_anywhere_door' as const
export const BUILTIN_SHRINK_LAMP_TOOL_ID = 'builtin_shrink_lamp' as const
export const BUILTIN_ENLARGE_LAMP_TOOL_ID = 'builtin_enlarge_lamp' as const
export const BUILTIN_AIR_CANNON_TOOL_ID = 'builtin_air_cannon' as const

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
export const TOOL_ID_WEATHER = 'weather' as const
export const TOOL_ID_TIME = 'time' as const
export const TOOL_ID_EXCHANGE = 'exchange_rate' as const
export const TOOL_ID_AIR_QUALITY = 'air_quality' as const
export const TOOL_ID_WEB_SUMMARY = 'web_summary' as const

const ICONS = {
  mode: '🧰',
  weather: '🌦️',
  time: '🕒',
  exchange: '💱',
  air: '🌫️',
  web: '📰',
  search: '🔎',
  developer: '🧪',
  design: '🎨',
  write: '✍️',
  agent: '🤖',
} as const

function rating(upvotes: number, downvotes: number): ToolRatingSummary {
  return {
    upvotes,
    downvotes,
    score: upvotes - downvotes,
  }
}

function usage(saves: number, opens: number, subscriptions: number): ToolUsageStats {
  return { saves, opens, subscriptions }
}

const STATIC_TOOL_REGISTRY: ToolItem[] = [
  {
    id: BUILTIN_ANYWHERE_DOOR_TOOL_ID,
    name: '任意门',
    icon: ICONS.mode,
    url: null,
    description: '内置模式：优先扩展候选面，再给出最实用的工具路径。',
    category: 'ai_assistant',
    tags: ['builtin', 'mode', 'discover'],
    source: 'builtin',
    status: 'active',
    executionMode: 'workflow',
    pricingModel: 'free',
    requiresAuth: false,
    platform: 'mixed',
    capabilities: ['discover', 'compare', 'recommend'],
    recommendedFor: ['模糊需求', '探索工具'],
    trustSignals: { curated: true, official: true, communityVerified: true },
    ratingSummary: rating(31, 2),
    usageStats: usage(25, 41, 4),
    subscriptionSupport: false,
    isBuiltin: true,
  },
  {
    id: BUILTIN_SHRINK_LAMP_TOOL_ID,
    name: '缩小灯',
    icon: ICONS.mode,
    url: null,
    description: '内置模式：把大问题拆成更小的工具任务。',
    category: 'productivity',
    tags: ['builtin', 'mode', 'plan'],
    source: 'builtin',
    status: 'active',
    executionMode: 'workflow',
    pricingModel: 'free',
    requiresAuth: false,
    platform: 'mixed',
    capabilities: ['decompose', 'task-frame'],
    recommendedFor: ['复杂任务', '拆解问题'],
    trustSignals: { curated: true, official: true, communityVerified: true },
    ratingSummary: rating(22, 1),
    usageStats: usage(18, 21, 2),
    subscriptionSupport: false,
    isBuiltin: true,
  },
  {
    id: BUILTIN_ENLARGE_LAMP_TOOL_ID,
    name: '放大灯',
    icon: ICONS.mode,
    url: null,
    description: '内置模式：强化解释、评估和对比。',
    category: 'developer',
    tags: ['builtin', 'mode', 'explain'],
    source: 'builtin',
    status: 'active',
    executionMode: 'workflow',
    pricingModel: 'free',
    requiresAuth: false,
    platform: 'mixed',
    capabilities: ['explain', 'compare', 'details'],
    recommendedFor: ['对比候选', '看优缺点'],
    trustSignals: { curated: true, official: true, communityVerified: true },
    ratingSummary: rating(18, 1),
    usageStats: usage(13, 16, 1),
    subscriptionSupport: false,
    isBuiltin: true,
  },
  {
    id: BUILTIN_AIR_CANNON_TOOL_ID,
    name: '空气炮',
    icon: ICONS.mode,
    url: null,
    description: '内置模式：更快收敛到一个可执行建议。',
    category: 'productivity',
    tags: ['builtin', 'mode', 'fast'],
    source: 'builtin',
    status: 'active',
    executionMode: 'workflow',
    pricingModel: 'free',
    requiresAuth: false,
    platform: 'mixed',
    capabilities: ['fast-answer', 'single-best-pick'],
    recommendedFor: ['要一个结论', '不想看太多候选'],
    trustSignals: { curated: true, official: true, communityVerified: true },
    ratingSummary: rating(24, 3),
    usageStats: usage(17, 30, 2),
    subscriptionSupport: false,
    isBuiltin: true,
  },
  {
    id: BUILTIN_ANSWER_BOOK_TOOL_ID,
    name: '答案之书',
    icon: ICONS.mode,
    url: null,
    description: '内置模式：只给一句短答，用于轻量启发。',
    category: 'ai_assistant',
    tags: ['builtin', 'short-answer'],
    source: 'builtin',
    status: 'active',
    executionMode: 'workflow',
    pricingModel: 'free',
    requiresAuth: false,
    platform: 'mixed',
    capabilities: ['short-answer'],
    recommendedFor: ['轻量问题'],
    trustSignals: { curated: true, official: true, communityVerified: true },
    ratingSummary: rating(16, 2),
    usageStats: usage(12, 14, 0),
    subscriptionSupport: false,
    isBuiltin: true,
  },
  {
    id: TOOL_ID_WEATHER,
    name: '天气工具',
    icon: ICONS.weather,
    url: null,
    description: '内化能力：直接查天气，返回可复用的工具卡片。',
    category: 'productivity',
    tags: ['weather', 'native', '城市'],
    source: 'builtin',
    status: 'active',
    executionMode: 'native_card',
    pricingModel: 'free',
    requiresAuth: false,
    platform: 'web',
    capabilities: ['weather'],
    recommendedFor: ['天气查询', '出行前查看'],
    trustSignals: { curated: true, official: true, communityVerified: true },
    ratingSummary: rating(55, 3),
    usageStats: usage(47, 76, 9),
    subscriptionSupport: true,
    defaultArgs: { location: '上海' },
    isBuiltin: true,
  },
  {
    id: TOOL_ID_TIME,
    name: '时间工具',
    icon: ICONS.time,
    url: null,
    description: '内化能力：快速查看当前时间与星期。',
    category: 'productivity',
    tags: ['time', 'clock'],
    source: 'builtin',
    status: 'active',
    executionMode: 'native_card',
    pricingModel: 'free',
    requiresAuth: false,
    platform: 'web',
    capabilities: ['time'],
    recommendedFor: ['当前时间', '时区确认'],
    trustSignals: { curated: true, official: true, communityVerified: true },
    ratingSummary: rating(29, 1),
    usageStats: usage(18, 43, 4),
    subscriptionSupport: false,
    isBuiltin: true,
  },
  {
    id: TOOL_ID_EXCHANGE,
    name: '汇率工具',
    icon: ICONS.exchange,
    url: null,
    description: '内化能力：查询货币汇率并直接换算。',
    category: 'productivity',
    tags: ['exchange', 'finance', 'currency'],
    source: 'builtin',
    status: 'active',
    executionMode: 'native_card',
    pricingModel: 'free',
    requiresAuth: false,
    platform: 'web',
    capabilities: ['exchange-rate'],
    recommendedFor: ['汇率查询', '金额换算'],
    trustSignals: { curated: true, official: true, communityVerified: true },
    ratingSummary: rating(34, 2),
    usageStats: usage(20, 38, 3),
    subscriptionSupport: false,
    isBuiltin: true,
  },
  {
    id: TOOL_ID_AIR_QUALITY,
    name: '空气质量工具',
    icon: ICONS.air,
    url: null,
    description: '内化能力：查询城市空气质量与 AQI。',
    category: 'productivity',
    tags: ['air', 'aqi', 'pm2.5'],
    source: 'builtin',
    status: 'active',
    executionMode: 'native_card',
    pricingModel: 'free',
    requiresAuth: false,
    platform: 'web',
    capabilities: ['air-quality'],
    recommendedFor: ['通勤前查看', '空气质量'],
    trustSignals: { curated: true, official: true, communityVerified: true },
    ratingSummary: rating(18, 1),
    usageStats: usage(11, 26, 1),
    subscriptionSupport: true,
    defaultArgs: { location: '上海' },
    isBuiltin: true,
  },
  {
    id: TOOL_ID_WEB_SUMMARY,
    name: '网页摘要工具',
    icon: ICONS.web,
    url: null,
    description: '内化能力：读取网页正文并返回摘要。',
    category: 'productivity',
    tags: ['summary', 'web', 'read'],
    source: 'builtin',
    status: 'active',
    executionMode: 'native_card',
    pricingModel: 'free',
    requiresAuth: false,
    platform: 'web',
    capabilities: ['web-summary'],
    recommendedFor: ['网页快速阅读', '文章摘要'],
    trustSignals: { curated: true, official: true, communityVerified: true },
    ratingSummary: rating(41, 4),
    usageStats: usage(28, 64, 6),
    subscriptionSupport: false,
    isBuiltin: true,
  },
]

export const BUILTIN_TOOL_REGISTRY: ToolItem[] = STATIC_TOOL_REGISTRY

export function getBuiltinToolById(id: string | null | undefined): ToolItem | null {
  if (!id) return null
  for (const item of BUILTIN_TOOL_REGISTRY) {
    if (item.id === id) return item
  }
  return null
}

export function isBuiltinToolId(id: string | null | undefined): boolean {
  return getBuiltinToolById(id) != null
}

export function getBuiltinTools(): ToolItem[] {
  return BUILTIN_TOOL_REGISTRY
}

export function isBuiltinTool(tool: ToolItem | null | undefined): boolean {
  if (!tool) return false
  return tool.source === 'builtin' || tool.isBuiltin === true
}

export function filterToolsByBuiltinAvailability(
  tools: ToolItem[],
  builtinToolsEnabled = true,
): ToolItem[] {
  if (builtinToolsEnabled) return tools
  return tools.filter((tool) => !isBuiltinTool(tool))
}

export function resolveBuiltinToolUrlById(id: string | null | undefined): string | null {
  const tool = getBuiltinToolById(id)
  if (!tool || tool.status !== 'active') return null
  return tool.url
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword))
}

function inferReason(query: string, tool: ToolItem): string {
  if (tool.executionMode === 'native_card')
    return `它是可直接在口袋里调用的原生能力，适合立刻执行“${query}”。`
  if (tool.category === 'search') return `它更适合先扩展信息面，再继续决策。`
  if (tool.category === 'developer') return `它针对开发任务更专用，能减少你手工折腾。`
  if (tool.category === 'design') return `它更像高频素材或设计工具，不适合硬做成内置能力。`
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

  if (includesAny(lower, ['天气', '气温', '下雨']) && tool.id === TOOL_ID_WEATHER) score += 120
  if (includesAny(lower, ['时间', '几点', '星期']) && tool.id === TOOL_ID_TIME) score += 120
  if (
    includesAny(lower, ['汇率', '美元', '人民币', '日元', '欧元']) &&
    tool.id === TOOL_ID_EXCHANGE
  )
    score += 120
  if (includesAny(lower, ['空气', 'aqi', 'pm2.5']) && tool.id === TOOL_ID_AIR_QUALITY) score += 120
  if (includesAny(lower, ['网页', '链接', '摘要', '文章总结']) && tool.id === TOOL_ID_WEB_SUMMARY)
    score += 120
  if (includesAny(lower, ['搜索', '调研', '资料']) && tool.id === TOOL_ID_PERPLEXITY) score += 58
  if (includesAny(lower, ['翻译', '中译英', '英译中']) && tool.id === TOOL_ID_FANYI) score += 58
  if (includesAny(lower, ['pdf', '合并', '压缩', '拆分']) && tool.id === TOOL_ID_PDF24) score += 58
  if (includesAny(lower, ['正则', 'regex']) && tool.id === TOOL_ID_REGEX101) score += 58
  if (includesAny(lower, ['抠图', '去背景']) && tool.id === TOOL_ID_REMOVE_BG) score += 58
  if (includesAny(lower, ['3d', '模型', 'mesh']) && tool.id === TOOL_ID_MESHY) score += 58
  if (includesAny(lower, ['代码截图', '代码图片']) && tool.id === TOOL_ID_CARBON) score += 58
  if (includesAny(lower, ['图标', 'icon']) && tool.id === TOOL_ID_FLATICON) score += 58
  if (includesAny(lower, ['长文', '总结', '长上下文']) && tool.id === TOOL_ID_KIMI) score += 52

  if (tool.source === 'builtin') score += 6
  if (tool.executionMode === 'native_card') score += 8
  return score
}

export function rankToolItems(
  tools: ToolItem[],
  query: string,
  opts?: {
    builtinToolsEnabled?: boolean
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
  return filterToolsByBuiltinAvailability(tools, opts?.builtinToolsEnabled ?? true)
    .filter((tool) => tool.status === 'active')
    .map((tool) => {
      let score = scoreToolMatch(query, tool)
      let sourceLabel: ToolMatch['sourceLabel'] = tool.source === 'builtin' ? 'builtin' : 'market'
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
