import type { MarketReviewTag } from '@/shared/market/market-types'

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
