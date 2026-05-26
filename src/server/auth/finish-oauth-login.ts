import 'server-only'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { seedToolsForUser } from '@/server/seeds/tool-seed'
import { upsertUserFromSupabaseUser } from '@/server/auth/user-sync'

export async function finishOAuthLogin(request: NextRequest, next: string) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return NextResponse.redirect(new URL('/login?error=session', request.url))
  }

  const user = await upsertUserFromSupabaseUser(data.user)
  await seedToolsForUser(user.id)

  return NextResponse.redirect(new URL(next, request.url))
}
