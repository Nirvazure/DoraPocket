import type {
  ToolCategory,
  ToolExecutionMode,
  ToolPlatform,
  ToolPricingModel,
} from '@/shared/tool-registry'

export type PocketSavedItem = {
  toolId: string
  presetArgs?: Record<string, unknown>
  sourceQuestion?: string
}

export type ToolVote = 'up' | 'down'

export type MarketFeedbackRecord = {
  toolId: string
  vote: ToolVote
  updatedAt: number
}

export type MarketSubmission = {
  id: string
  name: string
  url: string
  description: string
  tags: string[]
  submittedAt: number
  status: 'review' | 'listed'
}

export type MarketSubscriptionRecord = {
  toolId: string
  subscribedAt: number
  active: boolean
}

export type UserPreferenceProfile = {
  preferredCategories: ToolCategory[]
  preferredTags: string[]
  preferredPlatforms: ToolPlatform[]
  preferredPricing: ToolPricingModel[]
  preferredExecutionModes: ToolExecutionMode[]
  avoidAuthWall: boolean
  prefersSubscriptionTools: boolean
  summary: string[]
}

export type PreferenceProfileOverride = {
  preferredCategories?: ToolCategory[]
  preferredTags?: string[]
  preferredPlatforms?: ToolPlatform[]
  preferredPricing?: ToolPricingModel[]
  preferredExecutionModes?: ToolExecutionMode[]
  avoidAuthWall?: boolean
  prefersSubscriptionTools?: boolean
}

export type MarketContext = {
  savedItems: PocketSavedItem[]
  subscriptions: MarketSubscriptionRecord[]
  feedback: MarketFeedbackRecord[]
  submissions: MarketSubmission[]
  preferenceProfile: UserPreferenceProfile
}

export type AgentTaskFrame = {
  goal: string
  mode: 'discover' | 'use_builtin' | 'manage_pocket' | 'answer_book' | 'chat'
  missingInputs: string[]
}

export type AgentCandidate = {
  toolId: string
  title: string
  url?: string | null
  candidateType: 'tool' | 'submission'
  assetOrigin?: 'builtin' | 'curated_market' | 'bookmark_seed'
  score: number
  sourceLabel: 'builtin' | 'pocket' | 'market'
  reason: string
}

export type AgentUiPayload = {
  stageLabel: string
  stageTrail: string[]
  taskFrame: AgentTaskFrame
  candidates: AgentCandidate[]
  selectionReason: string
  selectionSignals: string[]
  preferenceSignals: string[]
  recommendedActions: string[]
  shouldAutoSave: boolean
}
