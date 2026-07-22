import { NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { MARKET_OWNER_USER_ID } from '@/shared/market/market-owner'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) {
    return NextResponse.json({ authenticated: false })
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      nickname: session.user.nickname,
      avatarSrc: session.user.avatarSrc,
      email: session.user.email,
      bio: session.user.bio,
      website: session.user.website,
      company: session.user.company,
      authCreatedAt: session.user.authCreatedAt?.toISOString() ?? null,
      lastSignInAt: session.user.lastSignInAt?.toISOString() ?? null,
      authRole: session.user.authRole,
      authProvider: session.user.authProvider,
      isMarketOwner: session.user.id === MARKET_OWNER_USER_ID,
    },
  })
}
