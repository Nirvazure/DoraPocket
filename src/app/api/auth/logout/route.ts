import { NextRequest, NextResponse } from 'next/server'
import { clearSupabaseSession } from '@/server/auth/session'

export async function GET(request: NextRequest) {
  await clearSupabaseSession()
  return NextResponse.redirect(new URL('/profile', request.url))
}
