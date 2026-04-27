// Legacy local storage bridge. Cloud market data is now served via /api/me/market/*.
import { readStorageJson, writeStorageJson } from '@/lib/storage'
import type { PocketInventoryItem } from '@/services/pocket-inventory'
import { getToolById } from '@/services/tool-registry'
import { MARKET_ACTIVITY_COPY } from '@/shared/ui-copy'
import type {
  ToolCategory,
  ToolExecutionMode,
  ToolItem,
  ToolPlatform,
  ToolPricingModel,
  ToolUsageStats,
} from '@/shared/tool-registry'
import type {
  MarketContext,
  MarketReviewAggregate,
  MarketReviewTag,
  MarketFeedbackRecord,
  MarketSubmission,
  MarketSubscriptionRecord,
  PreferenceProfileOverride,
  PocketSavedItem,
  ToolVote,
  UserPreferenceProfile,
} from '@/shared/market-types'

const FEEDBACK_STORAGE_KEY = 'dp-market-feedback-v1'
const SUBSCRIPTION_STORAGE_KEY = 'dp-market-subscriptions-v1'
const SUBMISSION_STORAGE_KEY = 'dp-market-submissions-v1'
const TOOL_ACTIVITY_STORAGE_KEY = 'dp-market-tool-activity-v1'
const PREFERENCE_OVERRIDE_STORAGE_KEY = 'dp-market-preference-override-v1'

export const POSITIVE_MARKET_REVIEW_TAGS = [
  'fast_to_start',
  'great_result',
  'chinese_friendly',
  'no_login',
  'beginner_friendly',
  'time_saving',
  'worth_saving',
] as const satisfies readonly MarketReviewTag[]

export const NEGATIVE_MARKET_REVIEW_TAGS = [
  'too_complex',
  'needs_login',
  'too_expensive',
  'average_result',
  'unstable',
  'not_for_this_task',
  'high_learning_cost',
] as const satisfies readonly MarketReviewTag[]

const ALL_MARKET_REVIEW_TAGS = new Set<MarketReviewTag>([
  ...POSITIVE_MARKET_REVIEW_TAGS,
  ...NEGATIVE_MARKET_REVIEW_TAGS,
])

function normalizeVote(value: unknown): ToolVote {
  return value === 'down' ? 'down' : 'up'
}

function normalizeStarRating(value: unknown, vote: ToolVote): 1 | 2 | 3 | 4 | 5 {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) return value
  return vote === 'up' ? 5 : 2
}

function normalizeSelectedTags(value: unknown): MarketReviewTag[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is MarketReviewTag =>
      typeof item === 'string' && ALL_MARKET_REVIEW_TAGS.has(item as MarketReviewTag),
  )
}

function normalizeSelectedTagsForVote(
  vote: ToolVote,
  selectedTags: MarketReviewTag[],
): MarketReviewTag[] {
  const allowedTags: ReadonlySet<MarketReviewTag> =
    vote === 'up'
      ? new Set<MarketReviewTag>(POSITIVE_MARKET_REVIEW_TAGS)
      : new Set<MarketReviewTag>(NEGATIVE_MARKET_REVIEW_TAGS)
  const normalized: MarketReviewTag[] = []
  for (const tag of selectedTags) {
    if (!allowedTags.has(tag) || normalized.includes(tag)) continue
    normalized.push(tag)
    if (normalized.length >= 3) break
  }
  return normalized
}

export function loadMarketFeedback(): MarketFeedbackRecord[] {
  const list = readStorageJson<unknown[]>(FEEDBACK_STORAGE_KEY, [])
  if (!Array.isArray(list)) return []
  const normalized = list
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .flatMap((item) => {
      if (typeof item.toolId !== 'string') return []
      const vote = normalizeVote(item.vote)
      return [
        {
          toolId: item.toolId,
          vote,
          starRating: normalizeStarRating(item.starRating, vote),
          selectedTags: normalizeSelectedTagsForVote(
            vote,
            normalizeSelectedTags(item.selectedTags),
          ),
          updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
        },
      ]
    })
  if (typeof window !== 'undefined') {
    const serialized = JSON.stringify(normalized)
    const current = window.localStorage.getItem(FEEDBACK_STORAGE_KEY)
    if (current !== serialized) {
      writeStorageJson(FEEDBACK_STORAGE_KEY, normalized)
    }
  }
  return normalized
}

export function saveMarketFeedback(input: {
  toolId: string
  vote: ToolVote
  starRating: 1 | 2 | 3 | 4 | 5
  selectedTags: MarketReviewTag[]
}) {
  const list = loadMarketFeedback()
  const next = list.filter((item) => item.toolId !== input.toolId)
  next.push({
    toolId: input.toolId,
    vote: input.vote,
    starRating: input.starRating,
    selectedTags: normalizeSelectedTagsForVote(input.vote, input.selectedTags),
    updatedAt: Date.now(),
  })
  writeStorageJson(FEEDBACK_STORAGE_KEY, next)
}

export function getToolReviewAggregate(toolId: string): MarketReviewAggregate {
  const currentUserReview = loadMarketFeedback().find((item) => item.toolId === toolId) ?? null
  if (!currentUserReview) {
    return {
      toolId,
      averageStar: null,
      reviewCount: 0,
      upvoteCount: 0,
      downvoteCount: 0,
      topTags: [],
      currentUserReview: null,
    }
  }

  const tagCounter = new Map<MarketReviewTag, number>()
  for (const tag of currentUserReview.selectedTags) {
    tagCounter.set(tag, (tagCounter.get(tag) ?? 0) + 1)
  }

  return {
    toolId,
    averageStar: currentUserReview.starRating,
    reviewCount: 1,
    upvoteCount: currentUserReview.vote === 'up' ? 1 : 0,
    downvoteCount: currentUserReview.vote === 'down' ? 1 : 0,
    topTags: [...tagCounter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([tag]) => tag),
    currentUserReview,
  }
}

export function getMarketReviewAggregates(): Record<string, MarketReviewAggregate> {
  // 后续推荐算法会消费这些结构化评价信号；当前版本先完成提交、展示和回流闭环。
  const feedback = loadMarketFeedback()
  return Object.fromEntries(
    feedback.map((item) => [item.toolId, getToolReviewAggregate(item.toolId)]),
  )
}

export function loadMarketSubscriptions(): MarketSubscriptionRecord[] {
  const list = readStorageJson<MarketSubscriptionRecord[]>(SUBSCRIPTION_STORAGE_KEY, [])
  return Array.isArray(list) ? list.filter((item) => item && typeof item.toolId === 'string') : []
}

export function setToolSubscription(toolId: string, active: boolean) {
  const list = loadMarketSubscriptions().filter((item) => item.toolId !== toolId)
  list.push({ toolId, active, subscribedAt: Date.now() })
  writeStorageJson(SUBSCRIPTION_STORAGE_KEY, list)
}

export function loadMarketSubmissions(): MarketSubmission[] {
  const list = readStorageJson<MarketSubmission[]>(SUBMISSION_STORAGE_KEY, [])
  return Array.isArray(list)
    ? list.filter((item) => item && typeof item.name === 'string' && typeof item.url === 'string')
    : []
}

type ToolActivityMap = Record<string, ToolUsageStats>

function loadToolActivityMap(): ToolActivityMap {
  return readStorageJson<ToolActivityMap>(TOOL_ACTIVITY_STORAGE_KEY, {})
}

function saveToolActivityMap(value: ToolActivityMap) {
  writeStorageJson(TOOL_ACTIVITY_STORAGE_KEY, value)
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
  type: 'feedback' | 'subscription' | 'submission' | 'review'
  title: string
  detail: string
  createdAt: number
}> {
  const feedback = loadMarketFeedback().map((item) => ({
    id: `review_${item.toolId}_${item.updatedAt}`,
    type: 'review' as const,
    title: item.vote === 'up' ? MARKET_ACTIVITY_COPY.reviewUp : MARKET_ACTIVITY_COPY.reviewDown,
    detail:
      item.selectedTags.length > 0
        ? `${resolveActivitySubject(item.toolId)} · ${item.selectedTags
            .slice(0, 2)
            .map((tag) => MARKET_ACTIVITY_COPY.reviewTags[tag])
            .join(' / ')}`
        : resolveActivitySubject(item.toolId),
    createdAt: item.updatedAt,
  }))
  const subscriptions = loadMarketSubscriptions().map((item) => ({
    id: `subscription_${item.toolId}_${item.subscribedAt}`,
    type: 'subscription' as const,
    title: item.active ? MARKET_ACTIVITY_COPY.subscribed : MARKET_ACTIVITY_COPY.unsubscribed,
    detail: resolveActivitySubject(item.toolId),
    createdAt: item.subscribedAt,
  }))
  const submissions = loadMarketSubmissions().map((item) => ({
    id: item.id,
    type: 'submission' as const,
    title: MARKET_ACTIVITY_COPY.submitted,
    detail: item.name,
    createdAt: item.submittedAt,
  }))
  return [...feedback, ...subscriptions, ...submissions]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
}

export function submitMarketTool(input: {
  name: string
  url: string
  description: string
  tags: string[]
}) {
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
  writeStorageJson(SUBMISSION_STORAGE_KEY, list.slice(0, 40))
}

export function loadPreferenceProfileOverride(): PreferenceProfileOverride {
  return readStorageJson<PreferenceProfileOverride>(PREFERENCE_OVERRIDE_STORAGE_KEY, {})
}

export function savePreferenceProfileOverride(value: PreferenceProfileOverride) {
  writeStorageJson(PREFERENCE_OVERRIDE_STORAGE_KEY, value)
}

export function resetPreferenceProfileOverride() {
  writeStorageJson(PREFERENCE_OVERRIDE_STORAGE_KEY, {})
}

function bumpCounter(counter: Map<string, number>, key: string, score: number) {
  if (!key || score === 0) return
  counter.set(key, (counter.get(key) ?? 0) + score)
}

function topKeys<Key extends string>(counter: Map<Key, number>, limit: number): Key[] {
  return [...counter.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key)
}

function summarizePreferenceProfile(profile: Omit<UserPreferenceProfile, 'summary'>): string[] {
  const summary: string[] = []
  if (profile.preferredCategories.length > 0) {
    summary.push(
      `${MARKET_ACTIVITY_COPY.summaries.preferredCategoriesPrefix} ${profile.preferredCategories
        .slice(0, 2)
        .join(' / ')} ${MARKET_ACTIVITY_COPY.summaries.preferredCategoriesSuffix}`,
    )
  }
  if (profile.preferredTags.length > 0) {
    summary.push(
      `${MARKET_ACTIVITY_COPY.summaries.savedTagsPrefix} ${profile.preferredTags
        .slice(0, 3)
        .join(' / ')} ${MARKET_ACTIVITY_COPY.summaries.savedTagsSuffix}`,
    )
  }
  if (profile.avoidAuthWall) summary.push(MARKET_ACTIVITY_COPY.summaries.avoidAuthWall)
  if (profile.preferredPricing.includes('free') || profile.preferredPricing.includes('freemium')) {
    summary.push(MARKET_ACTIVITY_COPY.summaries.lowTrialCost)
  }
  if (profile.prefersSubscriptionTools) {
    summary.push(MARKET_ACTIVITY_COPY.summaries.prefersSubscriptionTools)
  }
  return summary.slice(0, 4)
}

function inferUserPreferenceProfile(pocketInventory: PocketInventoryItem[]): UserPreferenceProfile {
  const categoryScores = new Map<ToolCategory, number>()
  const tagScores = new Map<string, number>()
  const platformScores = new Map<ToolPlatform, number>()
  const pricingScores = new Map<ToolPricingModel, number>()
  const executionScores = new Map<ToolExecutionMode, number>()
  let loginFreeScore = 0
  let authRequiredScore = 0
  let subscriptionToolScore = 0
  let nonSubscriptionToolScore = 0

  const feedbackMap = new Map(loadMarketFeedback().map((item) => [item.toolId, item.vote] as const))
  const subscriptions = new Set(
    loadMarketSubscriptions()
      .filter((item) => item.active)
      .map((item) => item.toolId),
  )

  const collect = (tool: ToolItem | null, weight: number) => {
    if (!tool || weight === 0) return
    bumpCounter(categoryScores, tool.category, weight)
    for (const tag of tool.tags.slice(0, 6)) bumpCounter(tagScores, tag, weight)
    bumpCounter(platformScores, tool.platform, weight)
    bumpCounter(pricingScores, tool.pricingModel, weight)
    bumpCounter(executionScores, tool.executionMode, weight)
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
    const activityWeight =
      Math.min(4, stats.opens) + Math.min(3, stats.saves) + Math.min(2, stats.subscriptions)
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
    categories: [
      'ai_assistant',
      'search',
      'developer',
      'design',
      'productivity',
      'media',
      'learning',
      'writing',
    ] satisfies ToolCategory[],
    platforms: ['web', 'desktop', 'mobile', 'api', 'mixed'] satisfies ToolPlatform[],
    pricing: ['free', 'freemium', 'paid', 'subscription'] satisfies ToolPricingModel[],
    executionModes: [
      'native_card',
      'external_link',
      'workflow',
      'reference_only',
    ] satisfies ToolExecutionMode[],
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
    preferenceProfile:
      mode === 'applied'
        ? applyPreferenceOverride(inferredProfile, loadPreferenceProfileOverride())
        : inferredProfile,
  }
}
