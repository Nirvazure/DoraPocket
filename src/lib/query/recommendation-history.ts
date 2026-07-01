import { useQuery } from '@tanstack/react-query'
import { useAuthenticatedQueryEnabled } from '@/lib/query/auth-session'
import { apiFetch } from '@/lib/query/api-client'
import { queryKeys } from '@/lib/query/query-keys'
import type { RecommendationHistoryItem } from '@/shared/user/profile-memory'

export function useRecommendationHistoryQuery() {
  const { enabled } = useAuthenticatedQueryEnabled()

  return useQuery({
    queryKey: queryKeys.recommendationHistory.list(),
    enabled,
    queryFn: async () =>
      apiFetch<{ items: RecommendationHistoryItem[] }>('/api/me/recommendations/history'),
  })
}
