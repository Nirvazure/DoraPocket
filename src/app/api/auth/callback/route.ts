import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ensureAppUserFromSupabaseUser } from '@/server/auth/user-sync'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim()
  const next = request.nextUrl.searchParams.get('next')?.trim() || '/analyse'
  const safeNext = next.startsWith('/') ? next : '/analyse'

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url),
    )
  }

  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return NextResponse.redirect(new URL('/login?error=session', request.url))
  }

  try {
    await ensureAppUserFromSupabaseUser(data.user)
  } catch (syncError) {
    const message = syncError instanceof Error ? syncError.message : 'user sync failed'
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
    )
  }

  return NextResponse.redirect(new URL(safeNext, request.url))
}
