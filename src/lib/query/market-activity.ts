import { queryOptions, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import { recentMarketActivity } from '@/services/market-storage'

export function getMarketActivityQueryOptions(limit = 4) {
  return queryOptions({
    queryKey: queryKeys.marketActivity.list(limit),
    queryFn: async () => recentMarketActivity(limit),
  })
}

export function useMarketActivityQuery(limit = 4) {
  return useQuery(getMarketActivityQueryOptions(limit))
}
