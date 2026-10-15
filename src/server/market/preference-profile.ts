import type { ToolModel as Tool } from '../../generated/prisma/models/Tool'
import type { PocketInventoryItem } from '@/shared/user/pocket-types'
import type {
  MarketFeedbackRecord,
  PreferenceProfileOverride,
  UserPreferenceProfile,
} from '@/shared/market/market-types'
import type { ToolCategory, ToolPlatform, ToolPricingModel } from '@/shared/market/tool-registry'
import { MARKET_ACTIVITY_COPY } from '@/shared/copy/ui-copy'

type ToolLookup = Map<string, Tool>
type ToolUsageStatsMap = Record<string, { saves: number; opens: number }>
type RecommendationEvaluationSignal = {
  selectedToolId?: string | null
  helpful?: boolean | null
  rating?: number | null
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

export function summarizePreferenceProfile(
  profile: Omit<UserPreferenceProfile, 'summary'>,
): string[] {
  const summary: string[] = []
  if (profile.preferredCategories.length > 0) {
    summary.push(
      `${MARKET_ACTIVITY_COPY.summaries.preferredCategoriesPrefix} ${profile.preferredCategories.slice(0, 2).join(' / ')} ${MARKET_ACTIVITY_COPY.summaries.preferredCategoriesSuffix}`,
    )
  }
  if (profile.preferredTags.length > 0) {
    summary.push(
      `${MARKET_ACTIVITY_COPY.summaries.savedTagsPrefix} ${profile.preferredTags.slice(0, 3).join(' / ')} ${MARKET_ACTIVITY_COPY.summaries.savedTagsSuffix}`,
    )
  }
  if (profile.avoidAuthWall) summary.push(MARKET_ACTIVITY_COPY.summaries.avoidAuthWall)
  if (profile.preferredPricing.includes('free') || profile.preferredPricing.includes('freemium')) {
    summary.push(MARKET_ACTIVITY_COPY.summaries.lowTrialCost)
  }
  return summary.slice(0, 4)
}

export function inferUserPreferenceProfile(args: {
  pocketInventory: PocketInventoryItem[]
  feedback: MarketFeedbackRecord[]
  activityMap: ToolUsageStatsMap
  tools: Tool[]
  recommendationEvaluations?: RecommendationEvaluationSignal[]
}): UserPreferenceProfile {
  const toolLookup: ToolLookup = new Map(args.tools.map((tool) => [tool.id, tool]))
  const categoryScores = new Map<ToolCategory, number>()
  const tagScores = new Map<string, number>()
  const platformScores = new Map<ToolPlatform, number>()
  const pricingScores = new Map<ToolPricingModel, number>()
  let loginFreeScore = 0
  let authRequiredScore = 0

  const collect = (tool: Tool | undefined, weight: number) => {
    if (!tool || weight === 0) return
    bumpCounter(categoryScores, tool.category as ToolCategory, weight)
    for (const tag of tool.tags.slice(0, 6)) bumpCounter(tagScores, tag, weight)
    if (tool.platform !== 'unknown')
      bumpCounter(platformScores, tool.platform as ToolPlatform, weight)
    if (tool.pricingModel !== 'unknown')
      bumpCounter(pricingScores, tool.pricingModel as ToolPricingModel, weight)
    if (tool.requiresAuth === true) authRequiredScore += weight
    else if (tool.requiresAuth === false) loginFreeScore += weight
  }

  for (const entry of args.pocketInventory) {
    collect(toolLookup.get(entry.toolId), 3 + Math.min(entry.useCount, 4))
  }
  for (const entry of args.feedback) {
    collect(toolLookup.get(entry.toolId), entry.vote === 'up' ? 2 : -3)
  }
  for (const [toolId, stats] of Object.entries(args.activityMap)) {
    collect(toolLookup.get(toolId), Math.min(4, stats.opens) + Math.min(3, stats.saves))
  }
  for (const entry of args.recommendationEvaluations ?? []) {
    if (!entry.selectedToolId) continue
    const ratingWeight = entry.rating ? Math.max(1, Math.min(5, entry.rating)) - 2 : 1
    const helpfulWeight = entry.helpful === false ? -4 : entry.helpful === true ? 4 : 1
    collect(toolLookup.get(entry.selectedToolId), helpfulWeight + ratingWeight)
  }

  const base = {
    preferredCategories: topKeys(categoryScores, 3),
    preferredTags: topKeys(tagScores, 5),
    preferredPlatforms: topKeys(platformScores, 2),
    preferredPricing: topKeys(pricingScores, 2),
    avoidAuthWall: loginFreeScore > 0 && loginFreeScore >= authRequiredScore,
  }

  return {
    ...base,
    summary: summarizePreferenceProfile(base),
  }
}

export function applyPreferenceOverride(
  profile: UserPreferenceProfile,
  override: PreferenceProfileOverride,
): UserPreferenceProfile {
  const merged = {
    preferredCategories: override.preferredCategories ?? profile.preferredCategories,
    preferredTags: override.preferredTags ?? profile.preferredTags,
    preferredPlatforms: override.preferredPlatforms ?? profile.preferredPlatforms,
    preferredPricing: override.preferredPricing ?? profile.preferredPricing,
    avoidAuthWall: override.avoidAuthWall ?? profile.avoidAuthWall,
  }

  return {
    ...merged,
    summary: summarizePreferenceProfile(merged),
  }
}
