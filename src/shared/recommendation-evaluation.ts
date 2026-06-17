import { z } from 'zod'

export const RECOMMENDATION_EVALUATION_TAGS = [
  'matched_task',
  'fast_to_start',
  'better_than_expected',
  'wrong_category',
  'too_expensive',
  'required_signup',
  'poor_result',
  'not_enough_context',
  'alternative_better',
] as const

export type RecommendationEvaluationTag = (typeof RECOMMENDATION_EVALUATION_TAGS)[number]

export type RecommendationOutcome = 'helpful' | 'not_helpful' | 'tried' | 'skipped'

export const recommendationEvaluationInputSchema = z.object({
  recommendationSessionId: z.string().min(1),
  selectedToolId: z.string().min(1).nullable().optional(),
  opened: z.boolean().optional(),
  saved: z.boolean().optional(),
  tried: z.boolean().optional(),
  helpful: z.boolean().nullable().optional(),
  outcome: z.enum(['helpful', 'not_helpful', 'tried', 'skipped']).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  tags: z.array(z.enum(RECOMMENDATION_EVALUATION_TAGS)).max(5).optional(),
  comment: z.string().max(500).nullable().optional(),
})

export type RecommendationEvaluationInput = z.infer<typeof recommendationEvaluationInputSchema>
