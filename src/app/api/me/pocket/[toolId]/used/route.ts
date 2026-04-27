import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { markToolUsed } from '@/server/repositories/pocket-repo'

type PocketUsedRouteContext = {
  params: Promise<{ toolId: string }>
}

export async function POST(_request: NextRequest, context: PocketUsedRouteContext) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { toolId } = await context.params
  return NextResponse.json(await markToolUsed(session.user.id, toolId))
}
