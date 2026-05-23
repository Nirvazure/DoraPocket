import type { MarketContext, UserPreferenceProfile } from '@/shared/market-types'

export function createEmptyPreferenceProfile(): UserPreferenceProfile {
  return {
    preferredCategories: [],
    preferredTags: [],
    preferredPlatforms: [],
    preferredPricing: [],
    preferredExecutionModes: [],
    avoidAuthWall: true,
    prefersSubscriptionTools: false,
    summary: [],
  }
}

export function createEmptyMarketContext(): MarketContext {
  return {
    builtinToolsEnabled: false,
    savedItems: [],
    feedback: [],
    subscriptions: [],
    submissions: [],
    preferenceProfile: createEmptyPreferenceProfile(),
  }
}
