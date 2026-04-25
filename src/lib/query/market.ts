import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import {
  buildMarketContext,
  loadMarketFeedback,
  loadMarketSubmissions,
  loadMarketSubscriptions,
  loadPreferenceProfileOverride,
  recordToolSubscribed,
  resetPreferenceProfileOverride,
  saveMarketFeedback,
  savePreferenceProfileOverride,
  setToolSubscription,
  submitMarketTool,
} from '@/services/market-storage'
import { loadPocketInventory } from '@/services/pocket-inventory'
import type {
  MarketContext,
  MarketFeedbackRecord,
  MarketSubmission,
  MarketSubscriptionRecord,
  PreferenceProfileOverride,
  ToolVote,
  UserPreferenceProfile,
} from '@/shared/market-types'

type SaveFeedbackInput = {
  toolId: string
  vote: ToolVote
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

function loadMarketContextSnapshot(mode: PreferenceMode = 'applied') {
  return buildMarketContext(loadPocketInventory(), mode)
}

function invalidateMarketDependents(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.marketFeedback.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.marketSubscriptions.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.marketSubmissions.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.preferenceProfile.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.marketContext.all })
}

export function useMarketFeedbackQuery() {
  return useQuery({
    queryKey: queryKeys.marketFeedback.list(),
    queryFn: async () => loadMarketFeedback(),
  })
}

export function useMarketSubscriptionsQuery() {
  return useQuery({
    queryKey: queryKeys.marketSubscriptions.list(),
    queryFn: async () => loadMarketSubscriptions(),
  })
}

export function useMarketSubmissionsQuery() {
  return useQuery({
    queryKey: queryKeys.marketSubmissions.list(),
    queryFn: async () => loadMarketSubmissions(),
  })
}

export function usePreferenceProfileQuery(mode: PreferenceMode = 'applied') {
  return useQuery<UserPreferenceProfile>({
    queryKey: queryKeys.preferenceProfile.current(mode),
    queryFn: async () => loadMarketContextSnapshot(mode).preferenceProfile,
  })
}

export function getMarketContextQueryOptions(mode: PreferenceMode = 'applied') {
  return queryOptions<MarketContext>({
    queryKey: queryKeys.marketContext.current(mode),
    queryFn: async () => loadMarketContextSnapshot(mode),
  })
}

export function useMarketContextQuery(mode: PreferenceMode = 'applied') {
  return useQuery(getMarketContextQueryOptions(mode))
}

export function usePreferenceProfileOverrideQuery() {
  return useQuery<PreferenceProfileOverride>({
    queryKey: queryKeys.preferenceProfileOverride.current(),
    queryFn: async () => loadPreferenceProfileOverride(),
  })
}

export function useSaveMarketFeedbackMutation() {
  const queryClient = useQueryClient()

  return useMutation<MarketFeedbackRecord[], Error, SaveFeedbackInput>({
    mutationFn: async ({ toolId, vote }) => {
      saveMarketFeedback(toolId, vote)
      return loadMarketFeedback()
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.marketFeedback.list(), next)
      invalidateMarketDependents(queryClient)
    },
  })
}

export function useSetToolSubscriptionMutation() {
  const queryClient = useQueryClient()

  return useMutation<MarketSubscriptionRecord[], Error, SetSubscriptionInput>({
    mutationFn: async ({ toolId, active }) => {
      if (active) {
        recordToolSubscribed(toolId)
      }
      setToolSubscription(toolId, active)
      return loadMarketSubscriptions()
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.marketSubscriptions.list(), next)
      invalidateMarketDependents(queryClient)
    },
  })
}

export function useSubmitMarketToolMutation() {
  const queryClient = useQueryClient()

  return useMutation<MarketSubmission[], Error, SubmitMarketToolInput>({
    mutationFn: async (input) => {
      submitMarketTool(input)
      return loadMarketSubmissions()
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.marketSubmissions.list(), next)
      invalidateMarketDependents(queryClient)
    },
  })
}

export function useSavePreferenceProfileOverrideMutation() {
  const queryClient = useQueryClient()

  return useMutation<PreferenceProfileOverride, Error, PreferenceProfileOverride>({
    mutationFn: async (input) => {
      savePreferenceProfileOverride(input)
      return loadPreferenceProfileOverride()
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.preferenceProfileOverride.current(), next)
      invalidateMarketDependents(queryClient)
    },
  })
}

export function useResetPreferenceProfileOverrideMutation() {
  const queryClient = useQueryClient()

  return useMutation<PreferenceProfileOverride, Error, void>({
    mutationFn: async () => {
      resetPreferenceProfileOverride()
      return loadPreferenceProfileOverride()
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.preferenceProfileOverride.current(), next)
      invalidateMarketDependents(queryClient)
    },
  })
}
