import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { getUserProfile, updateUserProfile } from '@/server/repositories/user-profile-repo'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getUserProfile(session.user.id))
}

export async function PATCH(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as { nickname: string; avatarSrc?: string }
  await updateUserProfile(session.user.id, body)
  return NextResponse.json(await getUserProfile(session.user.id))
}
