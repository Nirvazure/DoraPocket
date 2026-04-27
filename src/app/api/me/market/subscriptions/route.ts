import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import {
  listMarketSubscriptions,
  setToolSubscription,
} from '@/server/repositories/market-subscription-repo'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await listMarketSubscriptions(session.user.id))
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as { toolId: string; active: boolean }
  return NextResponse.json(await setToolSubscription(session.user.id, body.toolId, body.active))
}
