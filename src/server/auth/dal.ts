import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { prisma } from '@/server/db/prisma'
import { getSupabaseCurrentUser, getSupabaseSessionPayload } from '@/server/auth/session'

export const getCurrentUserOrNull = cache(async () => {
  const authUser = await getSupabaseCurrentUser()
  if (!authUser) return null

  return prisma.user.findUnique({
    where: { supabaseUserId: authUser.id },
    select: {
      id: true,
      supabaseUserId: true,
      email: true,
      nickname: true,
      avatarSrc: true,
      createdAt: true,
      updatedAt: true,
    },
  })
})

export const verifySession = cache(async () => {
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
