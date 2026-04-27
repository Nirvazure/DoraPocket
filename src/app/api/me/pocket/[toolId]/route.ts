import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { removeToolFromPocket, togglePocketFlag } from '@/server/repositories/pocket-repo'

type PocketRouteContext = {
  params: Promise<{ toolId: string }>
}

export async function DELETE(_request: NextRequest, context: PocketRouteContext) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { toolId } = await context.params
  return NextResponse.json(await removeToolFromPocket(session.user.id, toolId))
}

export async function PATCH(request: NextRequest, context: PocketRouteContext) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const { toolId } = await context.params
  const body = (await request.json()) as { field: 'pinned' | 'purchased' | 'archived' }
  return NextResponse.json(await togglePocketFlag(session.user.id, toolId, body.field))
}
