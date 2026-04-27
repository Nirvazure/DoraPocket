import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { listMarketFeedback } from '@/server/repositories/market-feedback-repo'
import { listMarketSubmissions } from '@/server/repositories/market-submission-repo'
import { listMarketSubscriptions } from '@/server/repositories/market-subscription-repo'

export async function GET(request: NextRequest) {
  const session = await verifySession()
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const limit = Number(request.nextUrl.searchParams.get('limit') || '8')
  const [feedback, subscriptions, submissions] = await Promise.all([
    listMarketFeedback(session.user.id),
    listMarketSubscriptions(session.user.id),
    listMarketSubmissions(session.user.id),
  ])
  const items = [
    ...feedback.map((item) => ({
      id: `review_${item.toolId}_${item.updatedAt}`,
      type: 'review',
      title: item.vote === 'up' ? '投了好票' : '投了不合适',
      detail: item.toolId,
      createdAt: item.updatedAt,
    })),
    ...subscriptions.map((item) => ({
      id: `subscription_${item.toolId}_${item.subscribedAt}`,
      type: 'subscription',
      title: item.active ? '订阅了工具' : '取消订阅',
      detail: item.toolId,
      createdAt: item.subscribedAt,
    })),
    ...submissions.map((item) => ({
      id: item.id,
      type: 'submission',
      title: '提交了工具',
      detail: item.name,
      createdAt: item.submittedAt,
    })),
  ]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit)
  return NextResponse.json(items)
}
