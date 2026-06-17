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
export type MarketReviewTag =
  | 'fast_to_start'
  | 'great_result'
  | 'chinese_friendly'
  | 'no_login'
  | 'beginner_friendly'
  | 'time_saving'
  | 'worth_saving'
  | 'too_complex'
  | 'needs_login'
  | 'too_expensive'
  | 'average_result'
  | 'unstable'
  | 'not_for_this_task'
  | 'high_learning_cost'

export type MarketReviewAggregate = {
  toolId: string
  averageStar: number | null
  reviewCount: number
  upvoteCount: number
  downvoteCount: number
  topTags: MarketReviewTag[]
  currentUserReview: MarketFeedbackRecord | null
}

export type MarketFeedbackRecord = {
  toolId: string
  vote: ToolVote
  starRating: 1 | 2 | 3 | 4 | 5
  selectedTags: MarketReviewTag[]
  updatedAt: number
}

export type MarketSubmission = {
  id: string
  toolId?: string | null
  name: string
  url: string
  description: string
  tags: string[]
  submittedAt: number
  status: 'review' | 'listed' | 'duplicate'
  duplicateSimilarity?: number | null
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
  mode: 'discover' | 'manage_pocket' | 'chat'
  missingInputs: string[]
  role?: string | null
  scenario?: string | null
  constraints: string[]
  budgetPreference?: 'free_first' | 'subscription_ok' | 'pay_as_you_go' | 'enterprise_budget' | null
  authPreference?: 'no_signup' | 'signup_ok' | null
  languagePreference?: 'chinese' | 'english_ok' | null
  evidenceRequirement?: 'citations' | 'not_required' | null
  platformPreference?: 'web' | 'mobile' | 'api' | null
  urgency?: 'fast_start' | 'quality_first' | 'unspecified'
  confidenceDrivers: string[]
}

export type AgentCandidate = {
  toolId?: string
  title: string
  url?: string | null
  candidateType: 'tool' | 'submission' | 'external_suggestion'
  assetOrigin?: 'curated_market' | 'bookmark_seed'
  score: number
  sourceLabel: 'pocket' | 'market' | 'external'
  reason: string
  externalConfidence?: number
  externalBoundary?: string
}

export type RecallSummary = {
  vectorEnabled: boolean
  vectorCount: number
  keywordCount: number
  mergedCount: number
  topVectorTools: Array<{ toolId: string; title: string }>
}

export type AgentUiPayload = {
  stageLabel: string
  stageTrail: string[]
  taskFrame: AgentTaskFrame
  candidates: AgentCandidate[]
  selectionReason: string
  decisionSummary?: string
  whyThisFirst?: string[]
  whyNotAlternatives?: Record<string, string>
  riskNotes?: string[]
  trustEvidence?: string[]
  communityEvidence?: string[]
  personalEvidence?: string[]
  evaluationPrompt?: string
  selectionSignals: string[]
  preferenceSignals: string[]
  recommendedActions: string[]
  recallSummary?: RecallSummary | null
  confidenceLevel?: 'normal' | 'low'
}
