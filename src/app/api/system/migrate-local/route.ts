import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { importLocalSnapshotForUser } from '@/server/migrations/local-import'
import type { LegacyLocalSnapshot } from '@/lib/local-snapshot'

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as { snapshot: LegacyLocalSnapshot }
  await importLocalSnapshotForUser(session.user.id, body.snapshot)
  return NextResponse.json({ ok: true })
}
