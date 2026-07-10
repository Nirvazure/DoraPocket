import 'server-only'

import type { User as SupabaseUser } from '@supabase/supabase-js'
import { isSupabasePublicConfigAvailable } from '@/lib/supabase/config'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type DoraSessionPayload = {
  supabaseUserId: string
  email?: string | null
  expiresAt?: number | null
}

function toSessionPayload(user: SupabaseUser): DoraSessionPayload {
  return {
    supabaseUserId: user.id,
    email: user.email?.trim() || null,
    expiresAt: typeof user.app_metadata?.exp === 'number' ? user.app_metadata.exp : null,
  }
}

export async function getSupabaseSessionPayload(): Promise<DoraSessionPayload | null> {
  if (!isSupabasePublicConfigAvailable()) return null
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return toSessionPayload(data.user)
}

export async function getSupabaseCurrentUser(): Promise<SupabaseUser | null> {
  if (!isSupabasePublicConfigAvailable()) return null
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

export async function clearSupabaseSession() {
  if (!isSupabasePublicConfigAvailable()) return
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
}
