export type RecommendationMode = 'market' | 'web'

export const DEFAULT_RECOMMENDATION_MODE: RecommendationMode = 'market'

export function normalizeRecommendationMode(value: unknown): RecommendationMode {
  return value === 'web' ? 'web' : DEFAULT_RECOMMENDATION_MODE
}
