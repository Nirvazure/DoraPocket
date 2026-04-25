import type {
  MarketContext,
  MarketFeedbackRecord,
  MarketSubmission,
  MarketSubscriptionRecord,
  PreferenceProfileOverride,
  PocketSavedItem,
  ToolVote,
  UserPreferenceProfile,
} from '@/shared/market-types'
import type { PocketInventoryItem } from '@/services/pocket-inventory'
import type { ToolCategory, ToolExecutionMode, ToolItem, ToolPlatform, ToolPricingModel, ToolUsageStats } from '@/shared/tool-registry'
import { getToolById } from '@/services/tool-registry'

const FEEDBACK_STORAGE_KEY = 'dp-market-feedback-v1'
const SUBSCRIPTION_STORAGE_KEY = 'dp-market-subscriptions-v1'
const SUBMISSION_STORAGE_KEY = 'dp-market-submissions-v1'
const TOOL_ACTIVITY_STORAGE_KEY = 'dp-market-tool-activity-v1'
const PREFERENCE_OVERRIDE_STORAGE_KEY = 'dp-market-preference-override-v1'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export function loadMarketFeedback(): MarketFeedbackRecord[] {
  const list = readJson<MarketFeedbackRecord[]>(FEEDBACK_STORAGE_KEY, [])
  return Array.isArray(list) ? list.filter((item) => item && typeof item.toolId === 'string') : []
}

export function saveMarketFeedback(toolId: string, vote: ToolVote) {
  const list = loadMarketFeedback()
  const next = list.filter((item) => item.toolId !== toolId)
  next.push({ toolId, vote, updatedAt: Date.now() })
  writeJson(FEEDBACK_STORAGE_KEY, next)
}

export function loadMarketSubscriptions(): MarketSubscriptionRecord[] {
  const list = readJson<MarketSubscriptionRecord[]>(SUBSCRIPTION_STORAGE_KEY, [])
  return Array.isArray(list) ? list.filter((item) => item && typeof item.toolId === 'string') : []
}

export function setToolSubscription(toolId: string, active: boolean) {
  const list = loadMarketSubscriptions().filter((item) => item.toolId !== toolId)
  list.push({ toolId, active, subscribedAt: Date.now() })
  writeJson(SUBSCRIPTION_STORAGE_KEY, list)
}

export function loadMarketSubmissions(): MarketSubmission[] {
  const list = readJson<MarketSubmission[]>(SUBMISSION_STORAGE_KEY, [])
  return Array.isArray(list) ? list.filter((item) => item && typeof item.name === 'string' && typeof item.url === 'string') : []
}

type ToolActivityMap = Record<string, ToolUsageStats>

function loadToolActivityMap(): ToolActivityMap {
  return readJson<ToolActivityMap>(TOOL_ACTIVITY_STORAGE_KEY, {})
}

function saveToolActivityMap(value: ToolActivityMap) {
  writeJson(TOOL_ACTIVITY_STORAGE_KEY, value)
}

function updateToolActivity(toolId: string, patch: Partial<ToolUsageStats>) {
  const current = loadToolActivityMap()
  const existing = current[toolId] ?? { saves: 0, opens: 0, subscriptions: 0 }
  current[toolId] = {
    saves: patch.saves ?? existing.saves,
    opens: patch.opens ?? existing.opens,
    subscriptions: patch.subscriptions ?? existing.subscriptions,
  }
  saveToolActivityMap(current)
}

export function recordToolSaved(toolId: string) {
  const current = loadToolActivityMap()
  const existing = current[toolId] ?? { saves: 0, opens: 0, subscriptions: 0 }
  updateToolActivity(toolId, { saves: existing.saves + 1 })
}

export function recordToolOpened(toolId: string) {
  const current = loadToolActivityMap()
  const existing = current[toolId] ?? { saves: 0, opens: 0, subscriptions: 0 }
  updateToolActivity(toolId, { opens: existing.opens + 1 })
}

export function recordToolSubscribed(toolId: string) {
  const current = loadToolActivityMap()
  const existing = current[toolId] ?? { saves: 0, opens: 0, subscriptions: 0 }
  updateToolActivity(toolId, { subscriptions: existing.subscriptions + 1 })
}

export function getToolActivityStats(toolId: string): ToolUsageStats {
  const current = loadToolActivityMap()
  return current[toolId] ?? { saves: 0, opens: 0, subscriptions: 0 }
}

function resolveActivitySubject(toolId: string) {
  const builtinOrMarketTool = getToolById(toolId)
  if (builtinOrMarketTool) return builtinOrMarketTool.name
  const submission = loadMarketSubmissions().find((item) => item.id === toolId)
  return submission?.name ?? toolId
}

export function recentMarketActivity(limit = 8): Array<{
  id: string
  type: 'feedback' | 'subscription' | 'submission'
  title: string
  detail: string
  createdAt: number
}> {
  const feedback = loadMarketFeedback().map((item) => ({
    id: `feedback_${item.toolId}_${item.updatedAt}`,
    type: 'feedback' as const,
    title: item.vote === 'up' ? '投了好票' : '投了不好票',
    detail: resolveActivitySubject(item.toolId),
    createdAt: item.updatedAt,
  }))
  const subscriptions = loadMarketSubscriptions().map((item) => ({
    id: `subscription_${item.toolId}_${item.subscribedAt}`,
    type: 'subscription' as const,
    title: item.active ? '订阅了工具' : '取消了订阅',
    detail: resolveActivitySubject(item.toolId),
    createdAt: item.subscribedAt,
  }))
  const submissions = loadMarketSubmissions().map((item) => ({
    id: item.id,
    type: 'submission' as const,
    title: '提交了市场工具',
    detail: item.name,
    createdAt: item.submittedAt,
  }))
  return [...feedback, ...subscriptions, ...submissions].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit)
}

export function submitMarketTool(input: { name: string; url: string; description: string; tags: string[] }) {
  const list = loadMarketSubmissions()
  list.unshift({
    id: `submission_${Date.now()}`,
    name: input.name.trim(),
    url: input.url.trim(),
    description: input.description.trim(),
    tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
    submittedAt: Date.now(),
    status: 'review',
  })
  writeJson(SUBMISSION_STORAGE_KEY, list.slice(0, 40))
}

export function loadPreferenceProfileOverride(): PreferenceProfileOverride {
  return readJson<PreferenceProfileOverride>(PREFERENCE_OVERRIDE_STORAGE_KEY, {})
}

export function savePreferenceProfileOverride(value: PreferenceProfileOverride) {
  writeJson(PREFERENCE_OVERRIDE_STORAGE_KEY, value)
}

export function resetPreferenceProfileOverride() {
  writeJson(PREFERENCE_OVERRIDE_STORAGE_KEY, {})
}

function bumpCounter(counter: Map<string, number>, key: string, score: number) {
  if (!key || score === 0) return
  counter.set(key, (counter.get(key) ?? 0) + score)
}

function topKeys(counter: Map<string, number>, limit: number) {
  return [...counter.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key)
}

function summarizePreferenceProfile(profile: Omit<UserPreferenceProfile, 'summary'>): string[] {
  const summary: string[] = []
  if (profile.preferredCategories.length > 0) summary.push(`偏好 ${profile.preferredCategories.slice(0, 2).join(' / ')} 类工具`)
  if (profile.preferredTags.length > 0) summary.push(`常收藏 ${profile.preferredTags.slice(0, 3).join(' / ')} 相关能力`)
  if (profile.avoidAuthWall) summary.push('更偏好免登录、轻摩擦工具')
  if (profile.preferredPricing.includes('free') || profile.preferredPricing.includes('freemium')) summary.push('对低试错成本工具更敏感')
  if (profile.prefersSubscriptionTools) summary.push('愿意把工具沉淀成长期订阅资产')
  return summary.slice(0, 4)
}

function inferUserPreferenceProfile(pocketInventory: PocketInventoryItem[]): UserPreferenceProfile {
  const categoryScores = new Map<string, number>()
  const tagScores = new Map<string, number>()
  const platformScores = new Map<string, number>()
  const pricingScores = new Map<string, number>()
  const executionScores = new Map<string, number>()
  let loginFreeScore = 0
  let authRequiredScore = 0
  let subscriptionToolScore = 0
  let nonSubscriptionToolScore = 0

  const feedbackMap = new Map(loadMarketFeedback().map((item) => [item.toolId, item.vote] as const))
  const subscriptions = new Set(loadMarketSubscriptions().filter((item) => item.active).map((item) => item.toolId))

  const collect = (tool: ToolItem | null, weight: number) => {
    if (!tool || weight === 0) return
    bumpCounter(categoryScores, tool.category, weight)
    for (const tag of tool.tags.slice(0, 6)) bumpCounter(tagScores, tag, weight)
    bumpCounter(platformScores, tool.platform as ToolPlatform, weight)
    bumpCounter(pricingScores, tool.pricingModel as ToolPricingModel, weight)
    bumpCounter(executionScores, tool.executionMode as ToolExecutionMode, weight)
    if (tool.requiresAuth) authRequiredScore += weight
    else loginFreeScore += weight
    if (tool.subscriptionSupport) subscriptionToolScore += weight
    else nonSubscriptionToolScore += weight
  }

  for (const entry of pocketInventory) {
    const tool = getToolById(entry.toolId)
    if (!tool) continue
    collect(tool, 3 + Math.min(entry.useCount, 4))
  }

  for (const toolId of subscriptions) {
    const tool = getToolById(toolId)
    if (!tool) continue
    collect(tool, 4)
  }

  for (const [toolId, vote] of feedbackMap) {
    const tool = getToolById(toolId)
    if (!tool) continue
    collect(tool, vote === 'up' ? 2 : -3)
  }

  const activityMap = loadToolActivityMap()
  for (const [toolId, stats] of Object.entries(activityMap)) {
    const tool = getToolById(toolId)
    if (!tool) continue
    const activityWeight = Math.min(4, stats.opens) + Math.min(3, stats.saves) + Math.min(2, stats.subscriptions)
    collect(tool, activityWeight)
  }

  const profileBase = {
    preferredCategories: topKeys(categoryScores, 3),
    preferredTags: topKeys(tagScores, 5),
    preferredPlatforms: topKeys(platformScores, 2),
    preferredPricing: topKeys(pricingScores, 2),
    preferredExecutionModes: topKeys(executionScores, 2),
    avoidAuthWall: loginFreeScore >= authRequiredScore,
    prefersSubscriptionTools: subscriptionToolScore > nonSubscriptionToolScore,
  }

  return {
    ...profileBase,
    summary: summarizePreferenceProfile(profileBase),
  }
}

function applyPreferenceOverride(
  profile: UserPreferenceProfile,
  override: PreferenceProfileOverride,
): UserPreferenceProfile {
  const mergedBase = {
    preferredCategories: override.preferredCategories ?? profile.preferredCategories,
    preferredTags: override.preferredTags ?? profile.preferredTags,
    preferredPlatforms: override.preferredPlatforms ?? profile.preferredPlatforms,
    preferredPricing: override.preferredPricing ?? profile.preferredPricing,
    preferredExecutionModes: override.preferredExecutionModes ?? profile.preferredExecutionModes,
    avoidAuthWall: override.avoidAuthWall ?? profile.avoidAuthWall,
    prefersSubscriptionTools: override.prefersSubscriptionTools ?? profile.prefersSubscriptionTools,
  }
  return {
    ...mergedBase,
    summary: summarizePreferenceProfile(mergedBase),
  }
}

export function getPreferenceCalibrationOptions() {
  return {
    categories: ['ai_assistant', 'search', 'developer', 'design', 'productivity', 'media', 'learning', 'writing'] satisfies ToolCategory[],
    platforms: ['web', 'desktop', 'mobile', 'api', 'mixed'] satisfies ToolPlatform[],
    pricing: ['free', 'freemium', 'paid', 'subscription'] satisfies ToolPricingModel[],
    executionModes: ['native_card', 'external_link', 'workflow', 'reference_only'] satisfies ToolExecutionMode[],
  }
}

export function buildMarketContext(
  pocketInventory: PocketInventoryItem[],
  mode: 'applied' | 'inferred' = 'applied',
): MarketContext {
  const savedItems: PocketSavedItem[] = pocketInventory.map((item) => ({
    toolId: item.toolId,
    presetArgs: item.presetArgs,
    sourceQuestion: item.sourceQuestion,
  }))

  const inferredProfile = inferUserPreferenceProfile(pocketInventory)
  return {
    savedItems,
    feedback: loadMarketFeedback(),
    subscriptions: loadMarketSubscriptions().filter((item) => item.active),
    submissions: loadMarketSubmissions(),
    preferenceProfile: mode === 'applied' ? applyPreferenceOverride(inferredProfile, loadPreferenceProfileOverride()) : inferredProfile,
  }
}
