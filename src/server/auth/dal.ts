import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { ensureAppUserFromSupabaseUser } from '@/server/auth/user-sync'
import { getDevMockSession, isDevMockAuthEnabled } from '@/server/auth/dev-mock-auth'
import { getSupabaseCurrentUser, getSupabaseSessionPayload } from '@/server/auth/session'

export const getCurrentUserOrNull = cache(async () => {
  if (isDevMockAuthEnabled()) {
    return getDevMockSession().user
  }

  const authUser = await getSupabaseCurrentUser()
  if (!authUser) return null

  return ensureAppUserFromSupabaseUser(authUser)
})

export const verifySession = cache(async () => {
  if (isDevMockAuthEnabled()) {
    return getDevMockSession()
  }

  const session = await getSupabaseSessionPayload()
  if (!session) return null
  const user = await getCurrentUserOrNull()
  if (!user) return null
  return {
    ...session,
    user,
    isAuth: true as const,
  }
})

export async function requireCurrentUser() {
  const session = await verifySession()
  if (!session?.user) {
    redirect('/login')
  }
  return session.user
}
