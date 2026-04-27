import { queryOptions, useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/query/api-client'
import { queryKeys } from '@/lib/query/query-keys'

export function getMarketActivityQueryOptions(limit = 4) {
  return queryOptions({
    queryKey: queryKeys.marketActivity.list(limit),
    queryFn: async () =>
      apiFetch<Array<{ id: string; title: string; detail: string; createdAt: number }>>(
        `/api/me/activity?limit=${limit}`,
      ),
  })
}

export function useMarketActivityQuery(limit = 4) {
  return useQuery(getMarketActivityQueryOptions(limit))
}
