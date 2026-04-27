// Legacy local storage bridge. Cloud pocket inventory is now served via /api/me/pocket.
import { readStorageJson, writeStorageJson } from '@/lib/storage'

export const POCKET_INVENTORY_STORAGE_KEY = 'dp-pocket-inventory-v1'

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

export function loadPocketInventory(): PocketInventoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = readStorageJson<unknown>(POCKET_INVENTORY_STORAGE_KEY, [])
    if (!Array.isArray(parsed)) return []

    const list: PocketInventoryItem[] = []
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue
      if (typeof item.toolId !== 'string' || item.toolId.trim() === '') continue
      const savedAt = Number(item.savedAt) || Date.now()
      const lastUsedAt = Number(item.lastUsedAt) || savedAt
      const useCount = Number(item.useCount) || 0
      const pinned = Boolean(item.pinned)
      const purchased = Boolean(item.purchased)
      const archived = Boolean(item.archived)
      const sourceQuestion =
        typeof item.sourceQuestion === 'string' ? item.sourceQuestion : undefined
      const presetArgs =
        item.presetArgs && typeof item.presetArgs === 'object' && !Array.isArray(item.presetArgs)
          ? (item.presetArgs as Record<string, unknown>)
          : undefined
      list.push({
        toolId: item.toolId,
        savedAt,
        lastUsedAt,
        useCount,
        pinned,
        purchased,
        archived,
        sourceQuestion,
        presetArgs,
      })
    }
    return list
  } catch {
    return []
  }
}

export function savePocketInventory(list: PocketInventoryItem[]): void {
  writeStorageJson(POCKET_INVENTORY_STORAGE_KEY, list)
}

export function sortPocketInventory(list: PocketInventoryItem[]): PocketInventoryItem[] {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (a.archived !== b.archived) return a.archived ? 1 : -1
    if (a.lastUsedAt !== b.lastUsedAt) return b.lastUsedAt - a.lastUsedAt
    return b.savedAt - a.savedAt
  })
}

export function upsertPocketItem(
  list: PocketInventoryItem[],
  toolId: string,
  patch?: Partial<PocketInventoryItem>,
): PocketInventoryItem[] {
  const now = Date.now()
  const next = [...list]
  const idx = next.findIndex((item) => item.toolId === toolId)
  if (idx >= 0) {
    const current = next[idx]
    next[idx] = {
      ...current,
      ...patch,
      toolId,
      lastUsedAt: patch?.lastUsedAt ?? current.lastUsedAt,
      useCount: patch?.useCount ?? current.useCount,
      archived: patch?.archived ?? current.archived,
      purchased: patch?.purchased ?? current.purchased,
    }
  } else {
    next.push({
      toolId,
      savedAt: patch?.savedAt ?? now,
      lastUsedAt: patch?.lastUsedAt ?? now,
      useCount: patch?.useCount ?? 0,
      pinned: patch?.pinned ?? false,
      purchased: patch?.purchased ?? false,
      archived: patch?.archived ?? false,
      sourceQuestion: patch?.sourceQuestion,
      presetArgs: patch?.presetArgs,
    })
  }
  return sortPocketInventory(next)
}
