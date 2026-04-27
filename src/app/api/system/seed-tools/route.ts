import { NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { seedToolsForUser } from '@/server/seeds/tool-seed'

export async function POST() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  await seedToolsForUser(session.user.id)
  return NextResponse.json({ ok: true })
}
