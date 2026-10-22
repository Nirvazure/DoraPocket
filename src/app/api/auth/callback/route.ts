import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { safeAuthReturnPath } from '@/server/auth/return-path'
import { ensureAppUserFromSupabaseUser } from '@/server/auth/user-sync'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')?.trim()
  const next = safeAuthReturnPath(url.searchParams.get('next'))
  const redirect = (path: string) =>
    NextResponse.redirect(new URL(path, url.origin), {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  if (!code) return redirect('/login?error=oauth_callback_failed')
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return redirect('/login?error=oauth_callback_failed')
    const { data, error: userError } = await supabase.auth.getUser()
    if (userError || !data.user) return redirect('/login?error=session')
    try {
      await ensureAppUserFromSupabaseUser(data.user)
    } catch {
      console.error('Unable to sync app user after OAuth callback')
      return redirect('/login?error=account_sync_failed')
    }
    return redirect(next)
  } catch {
    return redirect('/login?error=oauth_callback_failed')
  }
}
