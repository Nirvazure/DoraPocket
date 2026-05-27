import 'server-only'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function finishOAuthLogin(request: NextRequest, next: string) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return NextResponse.redirect(new URL('/login?error=session', request.url))
  }

  return NextResponse.redirect(new URL(next, request.url))
}
