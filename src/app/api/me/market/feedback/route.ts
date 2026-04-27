import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import {
  getMarketReviewAggregates,
  listMarketFeedback,
  saveMarketFeedback,
} from '@/server/repositories/market-feedback-repo'
import type { MarketReviewTag, ToolVote } from '@/shared/market-types'

export async function GET() {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({
    feedback: await listMarketFeedback(session.user.id),
    aggregates: await getMarketReviewAggregates(session.user.id),
  })
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = (await request.json()) as {
    toolId: string
    vote: ToolVote
    starRating: 1 | 2 | 3 | 4 | 5
    selectedTags: MarketReviewTag[]
  }
  const feedback = await saveMarketFeedback(session.user.id, body)
  return NextResponse.json({
    feedback,
    aggregates: await getMarketReviewAggregates(session.user.id),
  })
}
