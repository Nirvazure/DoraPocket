import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useAuthenticatedQueryEnabled } from '@/lib/query/auth-session'
import { apiFetch } from '@/lib/query/api-client'
import { queryKeys } from '@/lib/query/query-keys'
import type { PocketInventoryItem } from '@/shared/pocket-types'

type PocketMutationContext = {
  previousPocketInventory: PocketInventoryItem[]
}

type SaveToolToPocketInput = {
  toolId: string
  sourceQuestion?: string
  presetArgs?: Record<string, unknown>
}

type TogglePocketFlagInput = {
  toolId: string
}

function getPreviousPocketInventory(queryClient: QueryClient) {
  return queryClient.getQueryData<PocketInventoryItem[]>(queryKeys.pocket.list()) ?? []
}

async function preparePocketOptimisticUpdate(queryClient: QueryClient) {
  await queryClient.cancelQueries({ queryKey: queryKeys.pocket.list() })
  return getPreviousPocketInventory(queryClient)
}

function rollbackPocketInventory(queryClient: QueryClient, context?: PocketMutationContext) {
  if (context) {
    queryClient.setQueryData(queryKeys.pocket.list(), context.previousPocketInventory)
  }
}

function commitPocketInventory(queryClient: QueryClient, next: PocketInventoryItem[]) {
  queryClient.setQueryData(queryKeys.pocket.list(), next)
}

export function getPocketInventoryQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.pocket.list(),
    queryFn: async () => apiFetch<PocketInventoryItem[]>('/api/me/pocket'),
  })
}

export function usePocketInventoryQuery() {
  const { enabled } = useAuthenticatedQueryEnabled()

  const query = useQuery({
    ...getPocketInventoryQueryOptions(),
    enabled,
  })

  return {
    ...query,
    data: query.data ?? [],
  }
}

export function useSaveToolToPocketMutation() {
  const queryClient = useQueryClient()

  return useMutation<PocketInventoryItem[], Error, SaveToolToPocketInput, PocketMutationContext>({
    mutationFn: async ({ toolId, sourceQuestion, presetArgs }) =>
      apiFetch<PocketInventoryItem[]>('/api/me/pocket', {
        method: 'POST',
        body: JSON.stringify({ toolId, sourceQuestion, presetArgs }),
      }),
    onMutate: async () => {
      const previousPocketInventory = await preparePocketOptimisticUpdate(queryClient)
      return { previousPocketInventory }
    },
    onError: (_error, _variables, context) => {
      rollbackPocketInventory(queryClient, context)
    },
    onSuccess: (next) => {
      commitPocketInventory(queryClient, next)
    },
  })
}

export function useRemoveToolFromPocketMutation() {
  const queryClient = useQueryClient()

  return useMutation<PocketInventoryItem[], Error, TogglePocketFlagInput, PocketMutationContext>({
    mutationFn: async ({ toolId }) =>
      apiFetch<PocketInventoryItem[]>(`/api/me/pocket/${toolId}`, {
        method: 'DELETE',
      }),
    onMutate: async () => {
      const previousPocketInventory = await preparePocketOptimisticUpdate(queryClient)
      return { previousPocketInventory }
    },
    onError: (_error, _variables, context) => {
      rollbackPocketInventory(queryClient, context)
    },
    onSuccess: (next) => {
      commitPocketInventory(queryClient, next)
    },
  })
}

export function useMarkToolUsedMutation() {
  const queryClient = useQueryClient()

  return useMutation<PocketInventoryItem[], Error, TogglePocketFlagInput, PocketMutationContext>({
    mutationFn: async ({ toolId }) =>
      apiFetch<PocketInventoryItem[]>(`/api/me/pocket/${toolId}/used`, {
        method: 'POST',
      }),
    onMutate: async () => {
      const previousPocketInventory = await preparePocketOptimisticUpdate(queryClient)
      return { previousPocketInventory }
    },
    onError: (_error, _variables, context) => {
      rollbackPocketInventory(queryClient, context)
    },
    onSuccess: (next) => {
      commitPocketInventory(queryClient, next)
    },
  })
}
