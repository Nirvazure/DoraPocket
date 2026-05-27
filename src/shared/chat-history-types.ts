export type ChatHistoryEntry = {
  id: string
  userText: string
  assistantText: string
  selectedToolId?: string
  createdAt: number
}
