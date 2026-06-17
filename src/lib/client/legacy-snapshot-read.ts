'use client'

import { readStorageJson } from '@/lib/storage'
import { loadUserProfile, USER_PROFILE_STORAGE_KEY } from '@/lib/client/user-profile'
import type { ChatHistoryEntry } from '@/shared/chat-history-types'
import type {
  MarketFeedbackRecord,
  MarketReviewTag,
  MarketSubmission,
  MarketSubscriptionRecord,
  PreferenceProfileOverride,
  ToolVote,
} from '@/shared/market-types'
import type { PocketInventoryItem } from '@/shared/pocket-types'
import {
  getDefaultUserSettings,
  type ExplanationMode,
  type FontPreset,
  type InputModePreference,
  type UserSettings,
  type VoicePlaybackMode,
} from '@/shared/user-settings'

export const POCKET_INVENTORY_STORAGE_KEY = 'dp-pocket-inventory-v1'
export const CHAT_HISTORY_STORAGE_KEY = 'dp-chat-history-v1'
export const USER_SETTINGS_STORAGE_KEY = 'dp-user-settings-v1'
export const FEEDBACK_STORAGE_KEY = 'dp-market-feedback-v1'
export const SUBSCRIPTION_STORAGE_KEY = 'dp-market-subscriptions-v1'
export const SUBMISSION_STORAGE_KEY = 'dp-market-submissions-v1'
export const PREFERENCE_OVERRIDE_STORAGE_KEY = 'dp-market-preference-override-v1'
export const TOOL_ACTIVITY_STORAGE_KEY = 'dp-market-tool-activity-v1'
export const LEGACY_FONT_PRESET_STORAGE_KEY = 'dorapocket-font-preset'

function normalizeVoicePlaybackMode(value: unknown): VoicePlaybackMode {
  return value === 'off' || value === 'full' || value === 'key-result' ? value : 'key-result'
}

function normalizeInputMode(value: unknown): InputModePreference {
  return value === 'voice' ? 'voice' : 'text'
}

function normalizeExplanationMode(value: unknown): ExplanationMode {
  return value === 'brief' ? 'brief' : 'standard'
}

function normalizeFontPreset(value: unknown): FontPreset {
  return value === 'a' || value === 'b' || value === 'c' || value === 'd' ? value : 'c'
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function resolveLegacyFontPreset(): FontPreset {
  if (typeof window === 'undefined') return 'c'
  try {
    const value = window.localStorage.getItem(LEGACY_FONT_PRESET_STORAGE_KEY)
    return normalizeFontPreset(value)
  } catch {
    return 'c'
  }
}

export function readLegacyUserSettings(): UserSettings {
  const defaults = getDefaultUserSettings()
  const parsed = readStorageJson<unknown>(USER_SETTINGS_STORAGE_KEY, null)
  if (!parsed || typeof parsed !== 'object') {
    return {
      ...defaults,
      fontPreset: resolveLegacyFontPreset(),
    }
  }

  const raw = parsed as Partial<UserSettings>
  return {
    voicePlaybackEnabled: normalizeBoolean(raw.voicePlaybackEnabled, defaults.voicePlaybackEnabled),
    voicePlaybackMode: normalizeVoicePlaybackMode(raw.voicePlaybackMode),
    soundEffectsEnabled: normalizeBoolean(raw.soundEffectsEnabled, defaults.soundEffectsEnabled),
    defaultInputMode: normalizeInputMode(raw.defaultInputMode),
    memoryEnabled: normalizeBoolean(raw.memoryEnabled, defaults.memoryEnabled),
    explanationMode: normalizeExplanationMode(raw.explanationMode),
    fontPreset: normalizeFontPreset(raw.fontPreset ?? resolveLegacyFontPreset()),
  }
}

export function readLegacyPocketInventory(): PocketInventoryItem[] {
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

export function readLegacyChatHistory(): ChatHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (item): item is ChatHistoryEntry =>
          item &&
          typeof item.id === 'string' &&
          typeof item.userText === 'string' &&
          typeof item.assistantText === 'string' &&
          typeof item.createdAt === 'number',
      )
      .sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

function normalizeVote(value: unknown): ToolVote {
  return value === 'down' ? 'down' : 'up'
}

function normalizeStarRating(value: unknown, vote: ToolVote): 1 | 2 | 3 | 4 | 5 {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) return value
  return vote === 'up' ? 5 : 2
}

function normalizeSelectedTags(value: unknown): MarketReviewTag[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is MarketReviewTag => typeof item === 'string')
}

export function readLegacyMarketFeedback(): MarketFeedbackRecord[] {
  const list = readStorageJson<unknown[]>(FEEDBACK_STORAGE_KEY, [])
  if (!Array.isArray(list)) return []
  return list
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .flatMap((item) => {
      if (typeof item.toolId !== 'string') return []
      const vote = normalizeVote(item.vote)
      return [
        {
          toolId: item.toolId,
          vote,
          starRating: normalizeStarRating(item.starRating, vote),
          selectedTags: normalizeSelectedTags(item.selectedTags),
          updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
        },
      ]
    })
}

export function readLegacyMarketSubscriptions(): MarketSubscriptionRecord[] {
  const list = readStorageJson<MarketSubscriptionRecord[]>(SUBSCRIPTION_STORAGE_KEY, [])
  return Array.isArray(list) ? list.filter((item) => item && typeof item.toolId === 'string') : []
}

export function readLegacyMarketSubmissions(): MarketSubmission[] {
  const list = readStorageJson<MarketSubmission[]>(SUBMISSION_STORAGE_KEY, [])
  return Array.isArray(list)
    ? list.filter((item) => item && typeof item.name === 'string' && typeof item.url === 'string')
    : []
}

export function readLegacyPreferenceProfileOverride(): PreferenceProfileOverride {
  return readStorageJson<PreferenceProfileOverride>(PREFERENCE_OVERRIDE_STORAGE_KEY, {})
}

export function readLegacyToolActivityMap(): Record<
  string,
  { saves: number; opens: number; subscriptions: number }
> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(TOOL_ACTIVITY_STORAGE_KEY)
    return raw
      ? (JSON.parse(raw) as Record<string, { saves: number; opens: number; subscriptions: number }>)
      : {}
  } catch {
    return {}
  }
}

export function collectLegacyLocalSnapshotForMigration() {
  return {
    userProfile: loadUserProfile(),
    userSettings: readLegacyUserSettings(),
    pocketInventory: readLegacyPocketInventory(),
    marketFeedback: readLegacyMarketFeedback(),
    marketSubscriptions: readLegacyMarketSubscriptions(),
    marketSubmissions: readLegacyMarketSubmissions(),
    chatHistory: readLegacyChatHistory(),
    preferenceProfileOverride: readLegacyPreferenceProfileOverride(),
    toolActivityMap: readLegacyToolActivityMap(),
  }
}

export type LegacyLocalSnapshot = ReturnType<typeof collectLegacyLocalSnapshotForMigration>

export const collectLegacyLocalSnapshot = collectLegacyLocalSnapshotForMigration

function hasLegacyStorageKey(key: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(key) !== null
  } catch {
    return false
  }
}

export function hasLegacyLocalMigrationData(snapshot: LegacyLocalSnapshot): boolean {
  return (
    snapshot.pocketInventory.length > 0 ||
    snapshot.marketFeedback.length > 0 ||
    snapshot.marketSubscriptions.length > 0 ||
    snapshot.marketSubmissions.length > 0 ||
    snapshot.chatHistory.length > 0 ||
    hasLegacyStorageKey(USER_PROFILE_STORAGE_KEY) ||
    hasLegacyStorageKey(USER_SETTINGS_STORAGE_KEY) ||
    hasLegacyStorageKey(LEGACY_FONT_PRESET_STORAGE_KEY)
  )
}

export function clearLegacyLocalSnapshot() {
  if (typeof window === 'undefined') return
  for (const key of [
    USER_PROFILE_STORAGE_KEY,
    USER_SETTINGS_STORAGE_KEY,
    LEGACY_FONT_PRESET_STORAGE_KEY,
    POCKET_INVENTORY_STORAGE_KEY,
    CHAT_HISTORY_STORAGE_KEY,
    FEEDBACK_STORAGE_KEY,
    SUBMISSION_STORAGE_KEY,
    SUBSCRIPTION_STORAGE_KEY,
    PREFERENCE_OVERRIDE_STORAGE_KEY,
    TOOL_ACTIVITY_STORAGE_KEY,
  ]) {
    window.localStorage.removeItem(key)
  }
}
