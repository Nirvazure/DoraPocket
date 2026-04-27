import 'server-only'

import type { User } from '@supabase/supabase-js'

export function resolveSupabaseUserProfile(user: User) {
  const metadata = user.user_metadata
  const nickname =
    (typeof metadata?.nickname === 'string' && metadata.nickname.trim()) ||
    (typeof metadata?.name === 'string' && metadata.name.trim()) ||
    (typeof metadata?.full_name === 'string' && metadata.full_name.trim()) ||
    '用户'

  const avatarSrc =
    (typeof metadata?.avatar_url === 'string' && metadata.avatar_url.trim()) ||
    (typeof metadata?.picture === 'string' && metadata.picture.trim()) ||
    null

  return {
    supabaseUserId: user.id,
    email: user.email?.trim() || null,
    nickname,
    avatarSrc,
  }
}
