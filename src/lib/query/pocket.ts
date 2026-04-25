import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import {
  loadPocketInventory,
  savePocketInventory,
  sortPocketInventory,
  upsertPocketItem,
  type PocketInventoryItem,
} from '@/services/pocket-inventory'
import { recordToolOpened, recordToolSaved } from '@/services/market-storage'

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

function getPocketInventorySnapshot() {
  return sortPocketInventory(loadPocketInventory())
}

function setPocketInventorySnapshot(next: PocketInventoryItem[]) {
  savePocketInventory(next)
  return next
}

function invalidatePocketDependents(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.preferenceProfile.all })
  void queryClient.invalidateQueries({ queryKey: queryKeys.marketContext.all })
}

export function getPocketInventoryQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.pocket.list(),
    queryFn: async () => getPocketInventorySnapshot(),
  })
}

export function usePocketInventoryQuery() {
  return useQuery(getPocketInventoryQueryOptions())
}

export function useSaveToolToPocketMutation() {
  const queryClient = useQueryClient()

  return useMutation<PocketInventoryItem[], Error, SaveToolToPocketInput, PocketMutationContext>({
    mutationFn: async ({ toolId, sourceQuestion, presetArgs }) => {
      const next = upsertPocketItem(getPocketInventorySnapshot(), toolId, { sourceQuestion, presetArgs })
      recordToolSaved(toolId)
      return setPocketInventorySnapshot(next)
    },
    onMutate: async ({ toolId, sourceQuestion, presetArgs }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pocket.list() })
      const previousPocketInventory = queryClient.getQueryData<PocketInventoryItem[]>(queryKeys.pocket.list()) ?? getPocketInventorySnapshot()
      const next = upsertPocketItem(previousPocketInventory, toolId, { sourceQuestion, presetArgs })
      queryClient.setQueryData(queryKeys.pocket.list(), next)
      return { previousPocketInventory }
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.pocket.list(), context.previousPocketInventory)
      }
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.pocket.list(), next)
      invalidatePocketDependents(queryClient)
    },
  })
}

export function useRemoveToolFromPocketMutation() {
  const queryClient = useQueryClient()

  return useMutation<PocketInventoryItem[], Error, TogglePocketFlagInput, PocketMutationContext>({
    mutationFn: async ({ toolId }) => setPocketInventorySnapshot(getPocketInventorySnapshot().filter((item) => item.toolId !== toolId)),
    onMutate: async ({ toolId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pocket.list() })
      const previousPocketInventory = queryClient.getQueryData<PocketInventoryItem[]>(queryKeys.pocket.list()) ?? getPocketInventorySnapshot()
      queryClient.setQueryData(
        queryKeys.pocket.list(),
        previousPocketInventory.filter((item) => item.toolId !== toolId),
      )
      return { previousPocketInventory }
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.pocket.list(), context.previousPocketInventory)
      }
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.pocket.list(), next)
      invalidatePocketDependents(queryClient)
    },
  })
}

function createToggleMutation(field: 'pinned' | 'purchased' | 'archived') {
  return function useTogglePocketMutation() {
    const queryClient = useQueryClient()

    return useMutation<PocketInventoryItem[], Error, TogglePocketFlagInput, PocketMutationContext>({
      mutationFn: async ({ toolId }) => {
        const snapshot = getPocketInventorySnapshot()
        const current = snapshot.find((item) => item.toolId === toolId)
        if (!current) return snapshot
        return setPocketInventorySnapshot(upsertPocketItem(snapshot, toolId, { [field]: !current[field] }))
      },
      onMutate: async ({ toolId }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.pocket.list() })
        const previousPocketInventory = queryClient.getQueryData<PocketInventoryItem[]>(queryKeys.pocket.list()) ?? getPocketInventorySnapshot()
        const current = previousPocketInventory.find((item) => item.toolId === toolId)
        if (!current) return { previousPocketInventory }
        queryClient.setQueryData(
          queryKeys.pocket.list(),
          upsertPocketItem(previousPocketInventory, toolId, { [field]: !current[field] }),
        )
        return { previousPocketInventory }
      },
      onError: (_error, _variables, context) => {
        if (context) {
          queryClient.setQueryData(queryKeys.pocket.list(), context.previousPocketInventory)
        }
      },
      onSuccess: (next) => {
        queryClient.setQueryData(queryKeys.pocket.list(), next)
        invalidatePocketDependents(queryClient)
      },
    })
  }
}

export const useTogglePinToolMutation = createToggleMutation('pinned')
export const useTogglePurchasedToolMutation = createToggleMutation('purchased')
export const useToggleArchiveToolMutation = createToggleMutation('archived')

export function useMarkToolUsedMutation() {
  const queryClient = useQueryClient()

  return useMutation<PocketInventoryItem[], Error, TogglePocketFlagInput, PocketMutationContext>({
    mutationFn: async ({ toolId }) => {
      recordToolOpened(toolId)
      const snapshot = getPocketInventorySnapshot()
      const current = snapshot.find((item) => item.toolId === toolId)
      if (!current) return snapshot
      return setPocketInventorySnapshot(
        upsertPocketItem(snapshot, toolId, {
          lastUsedAt: Date.now(),
          useCount: current.useCount + 1,
        }),
      )
    },
    onMutate: async ({ toolId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pocket.list() })
      const previousPocketInventory = queryClient.getQueryData<PocketInventoryItem[]>(queryKeys.pocket.list()) ?? getPocketInventorySnapshot()
      const current = previousPocketInventory.find((item) => item.toolId === toolId)
      if (!current) return { previousPocketInventory }
      queryClient.setQueryData(
        queryKeys.pocket.list(),
        upsertPocketItem(previousPocketInventory, toolId, {
          lastUsedAt: Date.now(),
          useCount: current.useCount + 1,
        }),
      )
      return { previousPocketInventory }
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(queryKeys.pocket.list(), context.previousPocketInventory)
      }
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.pocket.list(), next)
      invalidatePocketDependents(queryClient)
    },
  })
}
