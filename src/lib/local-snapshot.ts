'use client'

import { loadChatHistory, CHAT_HISTORY_STORAGE_KEY } from '@/lib/client/chat-history'
import {
  loadMarketFeedback,
  loadMarketSubmissions,
  loadMarketSubscriptions,
  loadPreferenceProfileOverride,
} from '@/lib/client/market-storage'
import { loadPocketInventory, POCKET_INVENTORY_STORAGE_KEY } from '@/lib/client/pocket-inventory'
import { loadUserProfile, USER_PROFILE_STORAGE_KEY } from '@/lib/client/user-profile'
import { loadUserSettings, USER_SETTINGS_STORAGE_KEY } from '@/lib/client/user-settings'

export type LegacyLocalSnapshot = {
  userProfile: ReturnType<typeof loadUserProfile>
  userSettings: ReturnType<typeof loadUserSettings>
  pocketInventory: ReturnType<typeof loadPocketInventory>
  marketFeedback: ReturnType<typeof loadMarketFeedback>
  marketSubscriptions: ReturnType<typeof loadMarketSubscriptions>
  marketSubmissions: ReturnType<typeof loadMarketSubmissions>
  chatHistory: ReturnType<typeof loadChatHistory>
  preferenceProfileOverride: ReturnType<typeof loadPreferenceProfileOverride>
  toolActivityMap: Record<string, { saves: number; opens: number; subscriptions: number }>
}

const TOOL_ACTIVITY_STORAGE_KEY = 'dp-market-tool-activity-v1'

export function collectLegacyLocalSnapshot(): LegacyLocalSnapshot {
  let toolActivityMap: LegacyLocalSnapshot['toolActivityMap'] = {}
  try {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(TOOL_ACTIVITY_STORAGE_KEY)
      toolActivityMap = raw ? (JSON.parse(raw) as LegacyLocalSnapshot['toolActivityMap']) : {}
    }
  } catch {
    toolActivityMap = {}
  }

  return {
    userProfile: loadUserProfile(),
    userSettings: loadUserSettings(),
    pocketInventory: loadPocketInventory(),
    marketFeedback: loadMarketFeedback(),
    marketSubscriptions: loadMarketSubscriptions(),
    marketSubmissions: loadMarketSubmissions(),
    chatHistory: loadChatHistory(),
    preferenceProfileOverride: loadPreferenceProfileOverride(),
    toolActivityMap,
  }
}

export function clearLegacyLocalSnapshot() {
  if (typeof window === 'undefined') return
  for (const key of [
    USER_PROFILE_STORAGE_KEY,
    USER_SETTINGS_STORAGE_KEY,
    POCKET_INVENTORY_STORAGE_KEY,
    CHAT_HISTORY_STORAGE_KEY,
    'dp-market-feedback-v1',
    'dp-market-submissions-v1',
    'dp-market-subscriptions-v1',
    'dp-market-preference-override-v1',
    TOOL_ACTIVITY_STORAGE_KEY,
  ]) {
    window.localStorage.removeItem(key)
  }
}
