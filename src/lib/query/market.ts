import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { apiFetch } from '@/lib/query/api-client'
import { getMarketActivityQueryOptions } from '@/lib/query/market-activity'
import { queryKeys } from '@/lib/query/query-keys'
import type {
  MarketContext,
  MarketFeedbackRecord,
  MarketReviewAggregate,
  MarketReviewTag,
  MarketSubmission,
  MarketSubscriptionRecord,
  PreferenceProfileOverride,
  ToolVote,
  UserPreferenceProfile,
} from '@/shared/market-types'
import type { ToolItem } from '@/shared/tool-registry'

type SaveFeedbackInput = {
  toolId: string
  vote: ToolVote
  starRating?: 1 | 2 | 3 | 4 | 5
  selectedTags?: MarketReviewTag[]
}

type SetSubscriptionInput = {
  toolId: string
  active: boolean
}

type SubmitMarketToolInput = {
  name: string
  url: string
  description: string
  tags: string[]
}

type PreferenceMode = 'applied' | 'inferred'

async function syncMarketDerivedSnapshots(queryClient: QueryClient) {
  const [applied, inferred, override] = await Promise.all([
    apiFetch<MarketContext>('/api/me/market/context?mode=applied'),
    apiFetch<MarketContext>('/api/me/market/context?mode=inferred'),
    apiFetch<PreferenceProfileOverride>('/api/me/preferences/override'),
  ])
  queryClient.setQueryData(queryKeys.marketContext.current('applied'), applied)
  queryClient.setQueryData(queryKeys.marketContext.current('inferred'), inferred)
  queryClient.setQueryData(
    queryKeys.preferenceProfile.current('applied'),
    applied.preferenceProfile,
  )
  queryClient.setQueryData(
    queryKeys.preferenceProfile.current('inferred'),
    inferred.preferenceProfile,
  )
  queryClient.setQueryData(queryKeys.preferenceProfileOverride.current(), override)
}

function syncMarketActivitySnapshot(queryClient: QueryClient, limit = 4) {
  void queryClient.fetchQuery(getMarketActivityQueryOptions(limit))
}

function invalidateMarketDependents(queryClient: QueryClient) {
  void syncMarketDerivedSnapshots(queryClient)
  syncMarketActivitySnapshot(queryClient)
}

export function useMarketToolsQuery() {
  return useQuery({
    queryKey: ['marketTools'],
    queryFn: async () => apiFetch<ToolItem[]>('/api/market/tools').catch(() => []),
  })
}

export function useMarketFeedbackQuery() {
  return useQuery({
    queryKey: queryKeys.marketFeedback.list(),
    queryFn: async () =>
      (
        await apiFetch<{ feedback: MarketFeedbackRecord[] }>('/api/me/market/feedback').catch(
          () => ({ feedback: [] }),
        )
      ).feedback,
  })
}

export function useMarketSubscriptionsQuery() {
  return useQuery({
    queryKey: queryKeys.marketSubscriptions.list(),
    queryFn: async () =>
      apiFetch<MarketSubscriptionRecord[]>('/api/me/market/subscriptions').catch(() => []),
  })
}

export function useMarketReviewAggregatesQuery() {
  return useQuery<Record<string, MarketReviewAggregate>>({
    queryKey: queryKeys.marketReviewAggregates.list(),
    queryFn: async () =>
      (
        await apiFetch<{ aggregates: Record<string, MarketReviewAggregate> }>(
          '/api/me/market/feedback',
        ).catch(() => ({ aggregates: {} }))
      ).aggregates,
  })
}

export function useMarketSubmissionsQuery() {
  return useQuery({
    queryKey: queryKeys.marketSubmissions.list(),
    queryFn: async () => apiFetch<MarketSubmission[]>('/api/me/market/submissions').catch(() => []),
  })
}

export function usePreferenceProfileQuery(mode: PreferenceMode = 'applied') {
  return useQuery<UserPreferenceProfile>({
    queryKey: queryKeys.preferenceProfile.current(mode),
    queryFn: async () =>
      (
        await apiFetch<MarketContext>(`/api/me/market/context?mode=${mode}`).catch(() => ({
          savedItems: [],
          feedback: [],
          subscriptions: [],
          submissions: [],
          preferenceProfile: {
            preferredCategories: [],
            preferredTags: [],
            preferredPlatforms: [],
            preferredPricing: [],
            preferredExecutionModes: [],
            avoidAuthWall: true,
            prefersSubscriptionTools: false,
            summary: [],
          },
        }))
      ).preferenceProfile,
  })
}

export function getMarketContextQueryOptions(mode: PreferenceMode = 'applied') {
  return queryOptions<MarketContext>({
    queryKey: queryKeys.marketContext.current(mode),
    queryFn: async () => apiFetch<MarketContext>(`/api/me/market/context?mode=${mode}`),
  })
}

export function useMarketContextQuery(mode: PreferenceMode = 'applied') {
  return useQuery(getMarketContextQueryOptions(mode))
}

export function usePreferenceProfileOverrideQuery() {
  return useQuery<PreferenceProfileOverride>({
    queryKey: queryKeys.preferenceProfileOverride.current(),
    queryFn: async () =>
      apiFetch<PreferenceProfileOverride>('/api/me/preferences/override').catch(() => ({})),
  })
}

export function useSaveMarketFeedbackMutation() {
  const queryClient = useQueryClient()

  return useMutation<MarketFeedbackRecord[], Error, SaveFeedbackInput>({
    mutationFn: async (input) =>
      (
        await apiFetch<{ feedback: MarketFeedbackRecord[] }>('/api/me/market/feedback', {
          method: 'POST',
          body: JSON.stringify({
            ...input,
            starRating: input.starRating ?? (input.vote === 'up' ? 5 : 2),
            selectedTags: input.selectedTags ?? [],
          }),
        })
      ).feedback,
    onSuccess: async (next) => {
      queryClient.setQueryData(queryKeys.marketFeedback.list(), next)
      const review = await apiFetch<{ aggregates: Record<string, MarketReviewAggregate> }>(
        '/api/me/market/feedback',
      )
      queryClient.setQueryData(queryKeys.marketReviewAggregates.list(), review.aggregates)
      invalidateMarketDependents(queryClient)
    },
  })
}

export function useSetToolSubscriptionMutation() {
  const queryClient = useQueryClient()

  return useMutation<MarketSubscriptionRecord[], Error, SetSubscriptionInput>({
    mutationFn: async ({ toolId, active }) =>
      apiFetch<MarketSubscriptionRecord[]>('/api/me/market/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ toolId, active }),
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.marketSubscriptions.list(), next)
      invalidateMarketDependents(queryClient)
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
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.marketSubmissions.list(), next)
      void queryClient.invalidateQueries({ queryKey: ['marketTools'] })
      invalidateMarketDependents(queryClient)
    },
  })
}

export function useSavePreferenceProfileOverrideMutation() {
  const queryClient = useQueryClient()

  return useMutation<PreferenceProfileOverride, Error, PreferenceProfileOverride>({
    mutationFn: async (input) =>
      apiFetch<PreferenceProfileOverride>('/api/me/preferences/override', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.preferenceProfileOverride.current(), next)
      invalidateMarketDependents(queryClient)
    },
  })
}

export function useResetPreferenceProfileOverrideMutation() {
  const queryClient = useQueryClient()

  return useMutation<PreferenceProfileOverride, Error, void>({
    mutationFn: async () =>
      apiFetch<PreferenceProfileOverride>('/api/me/preferences/override', {
        method: 'DELETE',
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.preferenceProfileOverride.current(), next)
      invalidateMarketDependents(queryClient)
    },
  })
}
