export type PocketInventoryItem = {
  toolId: string
  savedAt: number
  lastUsedAt: number
  useCount: number
  pinned: boolean
  purchased: boolean
  archived: boolean
  sourceQuestion?: string
  presetArgs?: Record<string, unknown>
}
