import { NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { listRecommendationSessions } from '@/server/repositories/recommendation-session-repo'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ items: await listRecommendationSessions(session.user.id) })
}
