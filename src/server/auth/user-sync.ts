import 'server-only'

import type { User as SupabaseUser } from '@supabase/supabase-js'
import { prisma } from '@/server/db/prisma'
import { resolveSupabaseUserProfile } from '@/server/auth/supabase-user'

export async function upsertUserFromSupabaseUser(user: SupabaseUser) {
  if (!user.id?.trim()) {
    throw new Error('Supabase user missing id')
  }

  const profile = resolveSupabaseUserProfile(user)

  return prisma.user.upsert({
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
  })
}
