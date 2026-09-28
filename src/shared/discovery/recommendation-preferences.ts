export const DEFAULT_MIN_MATCH_SCORE = 70
export const DEFAULT_RECOMMENDATION_LIMIT = 5
export const RECOMMENDATION_LIMIT_OPTIONS = [3, 5, 10] as const

export type RecommendationLimit = (typeof RECOMMENDATION_LIMIT_OPTIONS)[number]

export type RecommendationPreferences = {
  minMatchScore: number
  recommendationLimit: RecommendationLimit
}

export const DEFAULT_RECOMMENDATION_PREFERENCES: RecommendationPreferences = {
  minMatchScore: DEFAULT_MIN_MATCH_SCORE,
  recommendationLimit: DEFAULT_RECOMMENDATION_LIMIT,
}

export function normalizeMinMatchScore(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) return DEFAULT_MIN_MATCH_SCORE
  return Math.min(100, Math.max(0, Math.round(parsed / 5) * 5))
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
  return {
    minMatchScore: normalizeMinMatchScore(value?.minMatchScore),
    recommendationLimit: normalizeRecommendationLimit(value?.recommendationLimit),
  }
}
