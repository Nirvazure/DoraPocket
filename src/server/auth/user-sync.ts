import 'server-only'

import type { User as SupabaseUser } from '@supabase/supabase-js'
import { prisma } from '@/server/db/prisma'
import { resolveSupabaseUserProfile } from '@/server/auth/supabase-user'
export const appUserSelect = {
  id: true,
  supabaseUserId: true,
  email: true,
  nickname: true,
  avatarSrc: true,
  createdAt: true,
  updatedAt: true,
} as const

export type AppUser = {
  id: string
  supabaseUserId: string
  email: string | null
  nickname: string
  avatarSrc: string | null
  createdAt: Date
  updatedAt: Date
}

export async function ensureAppUserFromSupabaseUser(user: SupabaseUser): Promise<AppUser> {
  if (!user.id?.trim()) {
    throw new Error('Supabase user missing id')
  }

  const profile = resolveSupabaseUserProfile(user)
  const appUser = await prisma.user.upsert({
    where: { supabaseUserId: profile.supabaseUserId },
    create: {
      supabaseUserId: profile.supabaseUserId,
      email: profile.email,
      nickname: profile.nickname,
      avatarSrc: profile.avatarSrc,
    },
    update: {
      email: profile.email,
      nickname: profile.nickname,
      avatarSrc: profile.avatarSrc,
    },
    select: appUserSelect,
  })

  return appUser
}
