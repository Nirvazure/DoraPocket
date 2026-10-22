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
import type { PocketInventoryItem } from '@/shared/user/pocket-types'

type PocketMutationContext = {
  previousPocketInventory: PocketInventoryItem[]
}

type SaveToolToPocketInput = {
  toolId: string
  sourceQuestion?: string
}

type TogglePocketFlagInput = {
  toolId: string
}

function createOptimisticPocketItem(
  input: SaveToolToPocketInput,
  now: number,
): PocketInventoryItem {
  return {
    toolId: input.toolId,
    savedAt: now,
    lastUsedAt: now,
    useCount: 0,
    pinned: false,
    purchased: false,
    archived: false,
    sourceQuestion: input.sourceQuestion,
  }
}

function optimisticallySavePocketItem(
  previous: PocketInventoryItem[],
  input: SaveToolToPocketInput,
  now: number,
): PocketInventoryItem[] {
  const existing = previous.find((item) => item.toolId === input.toolId)
  if (!existing) {
    return [createOptimisticPocketItem(input, now), ...previous]
  }

  return previous.map((item) =>
    item.toolId === input.toolId
      ? {
          ...item,
          archived: false,
          sourceQuestion: input.sourceQuestion,
        }
      : item,
  )
}

function optimisticallyRemovePocketItem(
  previous: PocketInventoryItem[],
  toolId: string,
): PocketInventoryItem[] {
  return previous.filter((item) => item.toolId !== toolId)
}

function optimisticallyMarkPocketItemUsed(
  previous: PocketInventoryItem[],
  toolId: string,
  now: number,
): PocketInventoryItem[] {
  return previous.map((item) =>
    item.toolId === toolId
      ? {
          ...item,
          lastUsedAt: now,
          useCount: item.useCount + 1,
        }
      : item,
  )
}

function getPreviousPocketInventory(queryClient: QueryClient, userId?: string) {
  return queryClient.getQueryData<PocketInventoryItem[]>(queryKeys.pocket.list(userId)) ?? []
}

async function preparePocketOptimisticUpdate(queryClient: QueryClient, userId?: string) {
  await queryClient.cancelQueries({ queryKey: queryKeys.pocket.list(userId) })
  return getPreviousPocketInventory(queryClient, userId)
}

function rollbackPocketInventory(
  queryClient: QueryClient,
  context?: PocketMutationContext,
  userId?: string,
) {
  if (context) {
    queryClient.setQueryData(queryKeys.pocket.list(userId), context.previousPocketInventory)
  }
}

function commitPocketInventory(
  queryClient: QueryClient,
  next: PocketInventoryItem[],
  userId?: string,
) {
  queryClient.setQueryData(queryKeys.pocket.list(userId), next)
}

export const __pocketCacheTestUtils = {
  createOptimisticPocketItem,
  optimisticallySavePocketItem,
  optimisticallyRemovePocketItem,
  optimisticallyMarkPocketItemUsed,
}

export function getPocketInventoryQueryOptions(userId?: string) {
  return queryOptions({
    queryKey: queryKeys.pocket.list(userId),
    queryFn: ({ signal }) => apiFetch<PocketInventoryItem[]>('/api/me/pocket', { signal }),
  })
}

export function usePocketInventoryQuery() {
  const { enabled, userId } = useAuthenticatedQueryEnabled()

  const query = useQuery({
    ...getPocketInventoryQueryOptions(userId),
    enabled,
  })

  return {
    ...query,
    data: (enabled ? query.data : undefined) ?? [],
  }
}

export function useSaveToolToPocketMutation() {
  const queryClient = useQueryClient()
  const { userId } = useAuthenticatedQueryEnabled()

  return useMutation<PocketInventoryItem[], Error, SaveToolToPocketInput, PocketMutationContext>({
    mutationFn: async ({ toolId, sourceQuestion }) =>
      apiFetch<PocketInventoryItem[]>('/api/me/pocket', {
        method: 'POST',
        body: JSON.stringify({ toolId, sourceQuestion }),
      }),
    onMutate: async (variables) => {
      const previousPocketInventory = await preparePocketOptimisticUpdate(queryClient, userId)
      commitPocketInventory(
        queryClient,
        optimisticallySavePocketItem(previousPocketInventory, variables, Date.now()),
        userId,
      )
      return { previousPocketInventory }
    },
    onError: (_error, _variables, context) => {
      rollbackPocketInventory(queryClient, context, userId)
    },
    onSuccess: (next) => {
      commitPocketInventory(queryClient, next, userId)
    },
  })
}

export function useRemoveToolFromPocketMutation() {
  const queryClient = useQueryClient()
  const { userId } = useAuthenticatedQueryEnabled()

  return useMutation<PocketInventoryItem[], Error, TogglePocketFlagInput, PocketMutationContext>({
    mutationFn: async ({ toolId }) =>
      apiFetch<PocketInventoryItem[]>(`/api/me/pocket/${toolId}`, {
        method: 'DELETE',
      }),
    onMutate: async ({ toolId }) => {
      const previousPocketInventory = await preparePocketOptimisticUpdate(queryClient, userId)
      commitPocketInventory(
        queryClient,
        optimisticallyRemovePocketItem(previousPocketInventory, toolId),
        userId,
      )
      return { previousPocketInventory }
    },
    onError: (_error, _variables, context) => {
      rollbackPocketInventory(queryClient, context, userId)
    },
    onSuccess: (next) => {
      commitPocketInventory(queryClient, next, userId)
    },
  })
}

export function useMarkToolUsedMutation() {
  const queryClient = useQueryClient()
  const { userId } = useAuthenticatedQueryEnabled()

  return useMutation<PocketInventoryItem[], Error, TogglePocketFlagInput, PocketMutationContext>({
    mutationFn: async ({ toolId }) =>
      apiFetch<PocketInventoryItem[]>(`/api/me/pocket/${toolId}/used`, {
        method: 'POST',
      }),
    onMutate: async ({ toolId }) => {
      const previousPocketInventory = await preparePocketOptimisticUpdate(queryClient, userId)
      commitPocketInventory(
        queryClient,
        optimisticallyMarkPocketItemUsed(previousPocketInventory, toolId, Date.now()),
        userId,
      )
      return { previousPocketInventory }
    },
    onError: (_error, _variables, context) => {
      rollbackPocketInventory(queryClient, context, userId)
    },
    onSuccess: (next) => {
      commitPocketInventory(queryClient, next, userId)
    },
  })
}
