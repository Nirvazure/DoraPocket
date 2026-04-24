export const CHAT_HISTORY_STORAGE_KEY = 'dp-chat-history-v1'

export type ChatHistoryEntry = {
  id: string
  userText: string
  assistantText: string
  selectedToolId?: string
  createdAt: number
}

function readHistory(): ChatHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is ChatHistoryEntry =>
        item &&
        typeof item.id === 'string' &&
        typeof item.userText === 'string' &&
        typeof item.assistantText === 'string' &&
        typeof item.createdAt === 'number',
    )
  } catch {
    return []
  }
}

function writeHistory(entries: ChatHistoryEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, 80)))
  } catch {
    /* ignore */
  }
}

export function loadChatHistory(): ChatHistoryEntry[] {
  return readHistory().sort((a, b) => b.createdAt - a.createdAt)
}

export function saveChatHistoryEntry(input: Omit<ChatHistoryEntry, 'id' | 'createdAt'>) {
  const entry: ChatHistoryEntry = {
    ...input,
    id: `chat_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
  }
  writeHistory([entry, ...loadChatHistory()])
  return entry
}

export function clearChatHistory() {
  writeHistory([])
}
