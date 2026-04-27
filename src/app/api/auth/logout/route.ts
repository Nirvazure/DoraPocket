import { NextResponse } from 'next/server'
import { getSiteUrl } from '@/lib/supabase/config'
import { clearSupabaseSession } from '@/server/auth/session'

export async function GET() {
  await clearSupabaseSession()
  return NextResponse.redirect(new URL('/', getSiteUrl()))
}
