export const DEFAULT_RECOMMENDATION_LIMIT = 5
export const RECOMMENDATION_LIMIT_OPTIONS = [3, 5, 10] as const

export type RecommendationLimit = (typeof RECOMMENDATION_LIMIT_OPTIONS)[number]

export const MIN_MATCH_SCORE_BY_LIMIT: Record<RecommendationLimit, number> = {
  3: 90,
  5: 80,
  10: 70,
}
export const DEFAULT_MIN_MATCH_SCORE = MIN_MATCH_SCORE_BY_LIMIT[DEFAULT_RECOMMENDATION_LIMIT]

export type RecommendationPreferences = {
  minMatchScore: number
  recommendationLimit: RecommendationLimit
}

export const DEFAULT_RECOMMENDATION_PREFERENCES: RecommendationPreferences = {
  minMatchScore: DEFAULT_MIN_MATCH_SCORE,
  recommendationLimit: DEFAULT_RECOMMENDATION_LIMIT,
}

export function normalizeRecommendationLimit(value: unknown): RecommendationLimit {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (parsed === 3 || parsed === 5 || parsed === 10) return parsed
  return DEFAULT_RECOMMENDATION_LIMIT
}

export function normalizeRecommendationPreferences(
  value:
    | {
        minMatchScore?: unknown
        recommendationLimit?: unknown
      }
    | null
    | undefined,
): RecommendationPreferences {
  const recommendationLimit = normalizeRecommendationLimit(value?.recommendationLimit)
  return {
    minMatchScore: MIN_MATCH_SCORE_BY_LIMIT[recommendationLimit],
    recommendationLimit,
  }
}
