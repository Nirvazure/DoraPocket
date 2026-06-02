import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { apiFetch } from '@/lib/query/api-client'
import { useAuthenticatedQueryEnabled } from '@/lib/query/auth-session'
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
import { normalizeMarketSearchQuery } from '@/shared/market-search-query'

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

const EMPTY_PREFERENCE_PROFILE: UserPreferenceProfile = {
  preferredCategories: [],
  preferredTags: [],
  preferredPlatforms: [],
  preferredPricing: [],
  preferredExecutionModes: [],
  avoidAuthWall: true,
  prefersSubscriptionTools: false,
  summary: [],
}

const EMPTY_MARKET_CONTEXT: MarketContext = {
  builtinToolsEnabled: false,
  savedItems: [],
  feedback: [],
  subscriptions: [],
  submissions: [],
  preferenceProfile: EMPTY_PREFERENCE_PROFILE,
}

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

export function useMarketFeedbackQuery() {
  const { enabled } = useAuthenticatedQueryEnabled()

  const query = useQuery({
    queryKey: queryKeys.marketFeedback.list(),
    enabled,
    queryFn: async () =>
      (await apiFetch<{ feedback: MarketFeedbackRecord[] }>('/api/me/market/feedback')).feedback,
  })

  return {
    ...query,
    data: query.data ?? [],
  }
}

export function useMarketSubscriptionsQuery() {
  const { enabled } = useAuthenticatedQueryEnabled()

  const query = useQuery({
    queryKey: queryKeys.marketSubscriptions.list(),
    enabled,
    queryFn: async () => apiFetch<MarketSubscriptionRecord[]>('/api/me/market/subscriptions'),
  })

  return {
    ...query,
    data: query.data ?? [],
  }
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

export function useMarketSubmissionsQuery() {
  const { enabled } = useAuthenticatedQueryEnabled()

  const query = useQuery({
    queryKey: queryKeys.marketSubmissions.list(),
    enabled,
    queryFn: async () => apiFetch<MarketSubmission[]>('/api/me/market/submissions'),
  })

  return {
    ...query,
    data: query.data ?? [],
  }
}

export function usePreferenceProfileQuery(mode: PreferenceMode = 'applied') {
  const { enabled } = useAuthenticatedQueryEnabled()

  const query = useQuery<UserPreferenceProfile>({
    queryKey: queryKeys.preferenceProfile.current(mode),
    enabled,
    queryFn: async () =>
      (await apiFetch<MarketContext>(`/api/me/market/context?mode=${mode}`)).preferenceProfile,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_PREFERENCE_PROFILE,
  }
}

export function getMarketContextQueryOptions(mode: PreferenceMode = 'applied') {
  return queryOptions<MarketContext>({
    queryKey: queryKeys.marketContext.current(mode),
    queryFn: async () => apiFetch<MarketContext>(`/api/me/market/context?mode=${mode}`),
  })
}

export function useMarketContextQuery(mode: PreferenceMode = 'applied') {
  const { enabled } = useAuthenticatedQueryEnabled()

  const query = useQuery({
    ...getMarketContextQueryOptions(mode),
    enabled,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_MARKET_CONTEXT,
  }
}

export function usePreferenceProfileOverrideQuery() {
  const { enabled } = useAuthenticatedQueryEnabled()

  const query = useQuery<PreferenceProfileOverride>({
    queryKey: queryKeys.preferenceProfileOverride.current(),
    enabled,
    queryFn: async () => apiFetch<PreferenceProfileOverride>('/api/me/preferences/override'),
  })

  return {
    ...query,
    data: query.data ?? {},
  }
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketTools.all })
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
