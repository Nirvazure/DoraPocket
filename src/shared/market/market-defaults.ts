import type { MarketContext, UserPreferenceProfile } from '@/shared/market/market-types'

export function createEmptyPreferenceProfile(): UserPreferenceProfile {
  return {
    preferredCategories: [],
    preferredTags: [],
    preferredPlatforms: [],
    preferredPricing: [],
    avoidAuthWall: true,
    summary: [],
  }
}

export function createEmptyMarketContext(): MarketContext {
  return {
    savedItems: [],
    feedback: [],
    preferenceProfile: createEmptyPreferenceProfile(),
  }
}
