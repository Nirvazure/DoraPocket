import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import {
  getDevMockUserSettings,
  isDevMockUserId,
  setDevMockUserSettings,
} from '@/server/auth/dev-mock-auth'
import { getUserSettings, upsertUserSettings } from '@/server/repositories/user-settings-repo'
import type { UserSettings } from '@/shared/user-settings'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (isDevMockUserId(session.user.id)) {
    return NextResponse.json(getDevMockUserSettings())
  }
  return NextResponse.json(await getUserSettings(session.user.id))
}

export async function PATCH(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as UserSettings
  if (isDevMockUserId(session.user.id)) {
    return NextResponse.json(setDevMockUserSettings(body))
  }
  await upsertUserSettings(session.user.id, body)
  return NextResponse.json(await getUserSettings(session.user.id))
}
