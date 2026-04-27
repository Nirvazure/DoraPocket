'use client'

import { useUserSettingsQuery, useUserSettingsSubscription } from '@/lib/query/user-settings'

export function UserSettingsSync() {
  useUserSettingsSubscription()
  useUserSettingsQuery()
  return null
}
