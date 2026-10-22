import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { safeAuthReturnPath } from '@/server/auth/return-path'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const next = safeAuthReturnPath(url.searchParams.get('next'))
  const callback = new URL('/api/auth/callback', url.origin)
  callback.searchParams.set('next', next)
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: callback.toString(), skipBrowserRedirect: true },
    })
    if (error || !data.url) throw new Error('OAuth start failed')
    return NextResponse.redirect(data.url, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return NextResponse.redirect(new URL('/login?error=oauth_start_failed', url.origin), {
      headers: { 'Cache-Control': 'private, no-store' },
    })
  }
}
