import type {
  ToolCategory,
  ToolExecutionMode,
  ToolPlatform,
  ToolPricingModel,
  ToolSource,
  ToolStatus,
  ToolTrustSignals,
} from '@/shared/tool-registry'

export type MarketSeedSourceType = 'tool' | 'resource' | 'inspiration'

export type MarketSeedInclusionStatus = 'included' | 'excluded'

export type MarketSeedFaviconMode = 'site_icon' | 'root_favicon' | 'fallback'

export type MarketBookmarkSeed = {
  seedId: string
  name: string
  homepageUrl: string
  displayUrl: string
  bookmarkTitle: string
  bookmarkUrl: string
  description: string
  category: ToolCategory
  tags: string[]
  source: Exclude<ToolSource, 'builtin'>
  sourceType: MarketSeedSourceType
  inclusionStatus: Extract<MarketSeedInclusionStatus, 'included'>
  status: ToolStatus
  executionMode: ToolExecutionMode
  pricingModel: ToolPricingModel
  requiresAuth: boolean
  platform: ToolPlatform
  capabilities: string[]
  recommendedFor: string[]
  sourceNote?: string
  trustSignals: ToolTrustSignals
  subscriptionSupport: boolean
  faviconMode: MarketSeedFaviconMode
  faviconUrl?: string
  faviconLocalPath?: string
  siteHostname: string
  seedNotes?: string
  isFromBookmarks: true
}

export type MarketBookmarkExcluded = {
  seedId: string
  bookmarkTitle: string
  bookmarkUrl: string
  inclusionStatus: Extract<MarketSeedInclusionStatus, 'excluded'>
  exclusionReason: string
  siteHostname: string
  seedNotes?: string
  isFromBookmarks: true
}
