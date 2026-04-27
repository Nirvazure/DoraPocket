import { NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      nickname: session.user.nickname,
      avatarSrc: session.user.avatarSrc,
      email: session.user.email,
    },
  })
}
