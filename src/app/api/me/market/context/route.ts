import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { buildMarketContextForUser, buildEmptyMarketContext } from '@/server/market/context'

export async function GET(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) {
    return NextResponse.json(buildEmptyMarketContext())
  }
  const mode = request.nextUrl.searchParams.get('mode') === 'inferred' ? 'inferred' : 'applied'
  return NextResponse.json(await buildMarketContextForUser(session.user.id, mode))
}
