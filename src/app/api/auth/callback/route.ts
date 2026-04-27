import type { EmailOtpType } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { seedToolsForUser } from '@/server/seeds/tool-seed'
import { upsertUserFromSupabaseUser } from '@/server/auth/user-sync'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim()
  const tokenHash = request.nextUrl.searchParams.get('token_hash')?.trim()
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null
  const next = request.nextUrl.searchParams.get('next')?.trim() || '/analyse'
  const safeNext = next.startsWith('/') ? next : '/analyse'

  const supabase = await createSupabaseServerClient()

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    if (error) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } else {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const user = await upsertUserFromSupabaseUser(data.user)
  await seedToolsForUser(user.id)

  return NextResponse.redirect(new URL(safeNext, request.url))
}
