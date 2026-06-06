import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/query/api-client'
import { useAuthenticatedQueryEnabled } from '@/lib/query/auth-session'
import { queryKeys } from '@/lib/query/query-keys'
import type {
  MarketFeedbackRecord,
  MarketReviewAggregate,
  MarketReviewTag,
  MarketSubmission,
  ToolVote,
} from '@/shared/market-types'
import type { ToolItem } from '@/shared/tool-registry'
import { normalizeMarketSearchQuery } from '@/shared/market-search-query'

type SaveFeedbackInput = {
  toolId: string
  vote: ToolVote
  starRating?: 1 | 2 | 3 | 4 | 5
  selectedTags?: MarketReviewTag[]
}

type SaveFeedbackResponse = {
  feedback: MarketFeedbackRecord[]
  aggregates: Record<string, MarketReviewAggregate>
}

type SubmitMarketToolInput = {
  name: string
  url: string
  description: string
  tags: string[]
}

export function getMarketToolsQueryOptions(searchQuery = '') {
  const normalizedQuery = normalizeMarketSearchQuery(searchQuery) ?? ''

  return {
    queryKey: queryKeys.marketTools.search(normalizedQuery),
    queryFn: async () => {
      const url =
        normalizedQuery.length > 0
          ? `/api/market/tools?q=${encodeURIComponent(normalizedQuery)}`
          : '/api/market/tools'
      return apiFetch<ToolItem[]>(url)
    },
  }
}

export function useMarketToolsQuery(searchQuery = '') {
  return useQuery({
    ...getMarketToolsQueryOptions(searchQuery),
    placeholderData: keepPreviousData,
  })
}

export function getMarketToolsByIdsQueryOptions(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))].sort()

  return {
    queryKey: queryKeys.marketTools.byIds(uniqueIds),
    queryFn: async () => {
      if (uniqueIds.length === 0) return [] as ToolItem[]
      return apiFetch<ToolItem[]>(
        `/api/market/tools/batch?ids=${encodeURIComponent(uniqueIds.join(','))}`,
      )
    },
    enabled: uniqueIds.length > 0,
    staleTime: 60_000,
  }
}

export function useMarketToolsByIdsQuery(ids: string[]) {
  return useQuery(getMarketToolsByIdsQueryOptions(ids))
}

export function useMarketReviewAggregatesQuery() {
  const { enabled } = useAuthenticatedQueryEnabled()

  const query = useQuery<Record<string, MarketReviewAggregate>>({
    queryKey: queryKeys.marketReviewAggregates.list(),
    enabled,
    queryFn: async () =>
      (
        await apiFetch<{ aggregates: Record<string, MarketReviewAggregate> }>(
          '/api/me/market/feedback',
        )
      ).aggregates,
  })

  return {
    ...query,
    data: query.data ?? {},
  }
}

export function useSaveMarketFeedbackMutation() {
  const queryClient = useQueryClient()

  return useMutation<SaveFeedbackResponse, Error, SaveFeedbackInput>({
    mutationFn: (input) =>
      apiFetch<SaveFeedbackResponse>('/api/me/market/feedback', {
        method: 'POST',
        body: JSON.stringify({
          ...input,
          starRating: input.starRating ?? (input.vote === 'up' ? 5 : 2),
          selectedTags: input.selectedTags ?? [],
        }),
      }),
    onSuccess: ({ aggregates }) => {
      queryClient.setQueryData(queryKeys.marketReviewAggregates.list(), aggregates)
    },
  })
}

export function useSubmitMarketToolMutation() {
  const queryClient = useQueryClient()

  return useMutation<MarketSubmission[], Error, SubmitMarketToolInput>({
    mutationFn: async (input) =>
      apiFetch<MarketSubmission[]>('/api/tools/submit', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketTools.all })
    },
  })
}
