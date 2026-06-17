import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifySession } from '@/server/auth/dal'
import {
  markRecommendationSessionOpened,
  markRecommendationSessionSaved,
} from '@/server/repositories/recommendation-session-repo'

const sessionActionSchema = z.object({
  recommendationSessionId: z.string().min(1),
  toolId: z.string().min(1),
  action: z.enum(['opened', 'saved']),
})

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const parsed = sessionActionSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid recommendation session action' }, { status: 400 })
  }

  const result =
    parsed.data.action === 'opened'
      ? await markRecommendationSessionOpened(session.user.id, parsed.data)
      : await markRecommendationSessionSaved(session.user.id, parsed.data)

  return NextResponse.json({ updated: result.count })
}
