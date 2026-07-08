import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import {
  getPreferenceProfileOverride,
  resetPreferenceProfileOverride,
  savePreferenceProfileOverride,
} from '@/server/repositories/preference-repo'
import type { PreferenceProfileOverride } from '@/shared/market/market-types'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getPreferenceProfileOverride(session.user.id))
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as PreferenceProfileOverride
  return NextResponse.json(await savePreferenceProfileOverride(session.user.id, body))
}

export async function DELETE() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await resetPreferenceProfileOverride(session.user.id))
}
