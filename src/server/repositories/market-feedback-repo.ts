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
  const [allFeedback, currentUserFeedback] = await Promise.all([
    prisma.marketFeedback.findMany(),
    prisma.marketFeedback.findMany({ where: { userId } }),
  ])

  const currentUserMap = new Map(
    currentUserFeedback.map((item) => [item.toolId, toFeedbackRecord(item)]),
  )

  const feedbackByTool = new Map<string, typeof allFeedback>()
  for (const item of allFeedback) {
    const list = feedbackByTool.get(item.toolId) ?? []
    list.push(item)
    feedbackByTool.set(item.toolId, list)
  }

  const aggregates: Record<string, MarketReviewAggregate> = {}
  for (const [toolId, items] of feedbackByTool) {
    const starSum = items.reduce((sum, item) => sum + item.starRating, 0)
    const tagCounter = new Map<MarketReviewTag, number>()
    let upvoteCount = 0
    let downvoteCount = 0

    for (const item of items) {
      if (item.vote === 'up') upvoteCount += 1
      else downvoteCount += 1
      for (const tag of item.selectedTags) {
        const reviewTag = tag as MarketReviewTag
        tagCounter.set(reviewTag, (tagCounter.get(reviewTag) ?? 0) + 1)
      }
    }

    aggregates[toolId] = {
      toolId,
      averageStar: starSum / items.length,
      reviewCount: items.length,
      upvoteCount,
      downvoteCount,
      topTags: [...tagCounter.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([tag]) => tag),
      currentUserReview: currentUserMap.get(toolId) ?? null,
    }
  }

  return aggregates
}
