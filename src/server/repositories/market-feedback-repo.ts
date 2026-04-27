import 'server-only'

import { prisma } from '@/server/db/prisma'
import type {
  MarketFeedbackRecord,
  MarketReviewAggregate,
  MarketReviewTag,
  ToolVote,
} from '@/shared/market-types'

function toFeedbackRecord(item: {
  toolId: string
  vote: string
  starRating: number
  selectedTags: string[]
  updatedAt: Date
}): MarketFeedbackRecord {
  return {
    toolId: item.toolId,
    vote: item.vote as ToolVote,
    starRating: Math.max(1, Math.min(5, item.starRating)) as 1 | 2 | 3 | 4 | 5,
    selectedTags: item.selectedTags as MarketReviewTag[],
    updatedAt: item.updatedAt.getTime(),
  }
}

export async function listMarketFeedback(userId: string): Promise<MarketFeedbackRecord[]> {
  const list = await prisma.marketFeedback.findMany({ where: { userId } })
  return list.map(toFeedbackRecord)
}

export async function saveMarketFeedback(
  userId: string,
  input: {
    toolId: string
    vote: ToolVote
    starRating: 1 | 2 | 3 | 4 | 5
    selectedTags: MarketReviewTag[]
  },
) {
  await prisma.marketFeedback.upsert({
    where: { userId_toolId: { userId, toolId: input.toolId } },
    create: {
      userId,
      toolId: input.toolId,
      vote: input.vote,
      starRating: input.starRating,
      selectedTags: input.selectedTags,
      updatedAt: new Date(),
    },
    update: {
      vote: input.vote,
      starRating: input.starRating,
      selectedTags: input.selectedTags,
      updatedAt: new Date(),
    },
  })
  return listMarketFeedback(userId)
}

export async function getMarketReviewAggregates(
  userId: string,
): Promise<Record<string, MarketReviewAggregate>> {
  const feedback = await listMarketFeedback(userId)
  return Object.fromEntries(
    feedback.map((item) => [
      item.toolId,
      {
        toolId: item.toolId,
        averageStar: item.starRating,
        reviewCount: 1,
        upvoteCount: item.vote === 'up' ? 1 : 0,
        downvoteCount: item.vote === 'down' ? 1 : 0,
        topTags: item.selectedTags.slice(0, 2),
        currentUserReview: item,
      },
    ]),
  )
}
