import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { saveRecommendationEvaluation } from '@/server/repositories/recommendation-evaluation-repo'
import { recommendationEvaluationInputSchema } from '@/shared/discovery/recommendation-evaluation'

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const parsed = recommendationEvaluationInputSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid recommendation evaluation' }, { status: 400 })
  }

  const evaluation = await saveRecommendationEvaluation(session.user.id, parsed.data)
  return NextResponse.json({ evaluation })
}
