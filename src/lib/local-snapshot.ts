'use client'

import {
  CHAT_HISTORY_STORAGE_KEY,
  collectLegacyLocalSnapshotForMigration,
  FEEDBACK_STORAGE_KEY,
  POCKET_INVENTORY_STORAGE_KEY,
  PREFERENCE_OVERRIDE_STORAGE_KEY,
  SUBMISSION_STORAGE_KEY,
  SUBSCRIPTION_STORAGE_KEY,
  TOOL_ACTIVITY_STORAGE_KEY,
  USER_SETTINGS_STORAGE_KEY,
} from '@/lib/client/legacy-snapshot-read'
import { USER_PROFILE_STORAGE_KEY } from '@/lib/client/user-profile'

export type LegacyLocalSnapshot = ReturnType<typeof collectLegacyLocalSnapshotForMigration>

export function collectLegacyLocalSnapshot(): LegacyLocalSnapshot {
  return collectLegacyLocalSnapshotForMigration()
}

export function clearLegacyLocalSnapshot() {
  if (typeof window === 'undefined') return
  for (const key of [
    USER_PROFILE_STORAGE_KEY,
    USER_SETTINGS_STORAGE_KEY,
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
