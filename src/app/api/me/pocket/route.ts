import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { listPocketItems, saveToolToPocket } from '@/server/repositories/pocket-repo'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await listPocketItems(session.user.id))
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as {
    toolId: string
    sourceQuestion?: string
    presetArgs?: Record<string, unknown>
  }
  return NextResponse.json(await saveToolToPocket(session.user.id, body))
}
