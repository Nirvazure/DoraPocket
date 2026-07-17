import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/query/api-client'
import type { RandomDoorRecommendation } from '@/shared/market/random-door'

export function useRandomDoorRecommendationMutation() {
  return useMutation<RandomDoorRecommendation, Error>({
    mutationFn: () => apiFetch<RandomDoorRecommendation>('/api/market/tools/random'),
  })
}
