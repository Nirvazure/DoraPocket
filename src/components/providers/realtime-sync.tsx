'use client'

import { useAuthSessionQuery } from '@/lib/query/auth-session'
import { useUserSettingsQuery } from '@/lib/query/user-settings'
import { useUserDataRealtime } from '@/lib/realtime/use-user-data-realtime'

export function RealtimeSyncProvider() {
  const { data: session } = useAuthSessionQuery()
  const userId =
    session?.authenticated && 'user' in session && session.user ? session.user.id : undefined

  useUserSettingsQuery()
  useUserDataRealtime(userId)

  return null
}
