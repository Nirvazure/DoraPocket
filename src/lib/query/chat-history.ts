import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import {
  clearChatHistory,
  loadChatHistory,
  saveChatHistoryEntry,
  type ChatHistoryEntry,
} from '@/services/chat-history'

type SaveChatHistoryInput = Omit<ChatHistoryEntry, 'id' | 'createdAt'>

export function useChatHistoryQuery() {
  return useQuery({
    queryKey: queryKeys.chatHistory.list(),
    queryFn: async () => loadChatHistory(),
  })
}

export function useSaveChatHistoryMutation() {
  const queryClient = useQueryClient()

  return useMutation<ChatHistoryEntry, Error, SaveChatHistoryInput>({
    mutationFn: async (input) => saveChatHistoryEntry(input),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.chatHistory.list(), loadChatHistory())
    },
  })
}

export function useClearChatHistoryMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, void>({
    mutationFn: async () => clearChatHistory(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.chatHistory.list(), [])
    },
  })
}
