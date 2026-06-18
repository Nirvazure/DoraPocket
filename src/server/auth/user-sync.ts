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
  bio: true,
  website: true,
  company: true,
  authCreatedAt: true,
  lastSignInAt: true,
  authRole: true,
  authProvider: true,
  createdAt: true,
  updatedAt: true,
} as const

export type AppUser = {
  id: string
  supabaseUserId: string
  email: string | null
  nickname: string
  avatarSrc: string | null
  bio: string | null
  website: string | null
  company: string | null
  authCreatedAt: Date | null
  lastSignInAt: Date | null
  authRole: string | null
  authProvider: string | null
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
      bio: profile.bio,
      website: profile.website,
      company: profile.company,
      authCreatedAt: profile.authCreatedAt,
      lastSignInAt: profile.lastSignInAt,
      authRole: profile.authRole,
      authProvider: profile.authProvider,
    },
    update: {
      email: profile.email,
      nickname: profile.nickname,
      avatarSrc: profile.avatarSrc,
      bio: profile.bio,
      website: profile.website,
      company: profile.company,
      authCreatedAt: profile.authCreatedAt,
      lastSignInAt: profile.lastSignInAt,
      authRole: profile.authRole,
      authProvider: profile.authProvider,
    },
    select: appUserSelect,
  })

  return appUser
}
