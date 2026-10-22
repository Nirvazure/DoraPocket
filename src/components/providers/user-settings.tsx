'use client'

import { useUserSettingsQuery } from '@/lib/query/user-settings'

export function UserSettingsProvider() {
  useUserSettingsQuery()
  return null
}
