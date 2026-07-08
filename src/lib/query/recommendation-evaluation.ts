import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/query/api-client'
import type { RecommendationEvaluationInput } from '@/shared/discovery/recommendation-evaluation'

export function useSaveRecommendationEvaluationMutation() {
  return useMutation({
    mutationFn: (input: RecommendationEvaluationInput) =>
      apiFetch('/api/me/recommendations/evaluation', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  })
}

export function useSaveRecommendationSessionActionMutation() {
  return useMutation({
    mutationFn: (input: {
      recommendationSessionId: string
      toolId: string
      action: 'opened' | 'saved'
    }) =>
      apiFetch('/api/me/recommendations/session-action', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  })
}
