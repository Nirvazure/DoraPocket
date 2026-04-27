import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/query/api-client'
import { queryKeys } from '@/lib/query/query-keys'
import type { ChatHistoryEntry } from '@/services/chat-history'

type SaveChatHistoryInput = Omit<ChatHistoryEntry, 'id' | 'createdAt'>

export function useChatHistoryQuery() {
  return useQuery({
    queryKey: queryKeys.chatHistory.list(),
    queryFn: async () => apiFetch<ChatHistoryEntry[]>('/api/me/chat-history').catch(() => []),
  })
}

export function useSaveChatHistoryMutation() {
  const queryClient = useQueryClient()

  return useMutation<ChatHistoryEntry, Error, SaveChatHistoryInput>({
    mutationFn: async (input) =>
      apiFetch<ChatHistoryEntry>('/api/me/chat-history', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (next) => {
      const current =
        queryClient.getQueryData<ChatHistoryEntry[]>(queryKeys.chatHistory.list()) ?? []
      queryClient.setQueryData(queryKeys.chatHistory.list(), [next, ...current])
    },
  })
}

export function useClearChatHistoryMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, void>({
    mutationFn: async () =>
      apiFetch<void>('/api/me/chat-history', {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.chatHistory.list(), [])
    },
  })
}
