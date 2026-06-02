import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import type { MarketReviewTag } from '../src/shared/market-types'
import {
  TOOL_ID_GEMINI,
  TOOL_ID_KIMI,
  TOOL_ID_PDF24,
  TOOL_ID_PERPLEXITY,
} from '../src/shared/tool-registry'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed market feedback')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

type SeedReview = {
  vote: 'up' | 'down'
  starRating: 1 | 2 | 3 | 4 | 5
  selectedTags: MarketReviewTag[]
}

const SEED_REVIEWS: Record<string, SeedReview[]> = {
  [TOOL_ID_KIMI]: [
    { vote: 'up', starRating: 5, selectedTags: ['chinese_friendly', 'time_saving'] },
    { vote: 'up', starRating: 5, selectedTags: ['great_result', 'chinese_friendly'] },
    { vote: 'up', starRating: 4, selectedTags: ['fast_to_start', 'worth_saving'] },
    { vote: 'up', starRating: 5, selectedTags: ['chinese_friendly', 'great_result'] },
    { vote: 'up', starRating: 4, selectedTags: ['time_saving'] },
    { vote: 'up', starRating: 5, selectedTags: ['worth_saving', 'beginner_friendly'] },
    { vote: 'up', starRating: 4, selectedTags: ['chinese_friendly'] },
    { vote: 'up', starRating: 5, selectedTags: ['great_result', 'time_saving'] },
    { vote: 'up', starRating: 4, selectedTags: ['fast_to_start'] },
    { vote: 'up', starRating: 5, selectedTags: ['chinese_friendly', 'worth_saving'] },
    { vote: 'up', starRating: 4, selectedTags: ['beginner_friendly'] },
    { vote: 'up', starRating: 5, selectedTags: ['great_result'] },
  ],
  [TOOL_ID_PERPLEXITY]: [
    { vote: 'up', starRating: 5, selectedTags: ['great_result', 'time_saving'] },
    { vote: 'up', starRating: 4, selectedTags: ['fast_to_start'] },
    { vote: 'up', starRating: 4, selectedTags: ['worth_saving'] },
    { vote: 'up', starRating: 5, selectedTags: ['great_result'] },
    { vote: 'up', starRating: 3, selectedTags: ['needs_login'] },
    { vote: 'down', starRating: 2, selectedTags: ['too_complex'] },
  ],
  [TOOL_ID_GEMINI]: [
    { vote: 'up', starRating: 4, selectedTags: ['great_result', 'beginner_friendly'] },
    { vote: 'up', starRating: 4, selectedTags: ['fast_to_start'] },
    { vote: 'up', starRating: 3, selectedTags: ['average_result'] },
  ],
  web_summary: [
    { vote: 'up', starRating: 4, selectedTags: ['time_saving', 'no_login'] },
    { vote: 'up', starRating: 5, selectedTags: ['fast_to_start', 'worth_saving'] },
  ],
  [TOOL_ID_PDF24]: [
    { vote: 'up', starRating: 3, selectedTags: ['average_result'] },
    { vote: 'down', starRating: 2, selectedTags: ['too_complex', 'high_learning_cost'] },
  ],
}

async function ensureSeedUser(index: number) {
  const supabaseUserId = `seed-feedback-${String(index).padStart(2, '0')}`
  return prisma.user.upsert({
    where: { supabaseUserId },
    create: {
      supabaseUserId,
      nickname: `体验官 ${index}`,
      email: `seed-feedback-${index}@dorapocket.local`,
    },
    update: {},
  })
}

async function main() {
  let reviewIndex = 0

  for (const [toolId, reviews] of Object.entries(SEED_REVIEWS)) {
    const tool = await prisma.tool.findUnique({ where: { id: toolId } })
    if (!tool) {
      console.warn(`Skip ${toolId}: tool not found in database. Run yarn seed:tools first.`)
      continue
    }

    for (const review of reviews) {
      reviewIndex += 1
      const user = await ensureSeedUser(reviewIndex)

      await prisma.marketFeedback.upsert({
        where: { userId_toolId: { userId: user.id, toolId } },
        create: {
          userId: user.id,
          toolId,
          vote: review.vote,
          starRating: review.starRating,
          selectedTags: review.selectedTags,
          updatedAt: new Date(Date.now() - reviewIndex * 3_600_000),
        },
        update: {
          vote: review.vote,
          starRating: review.starRating,
          selectedTags: review.selectedTags,
          updatedAt: new Date(Date.now() - reviewIndex * 3_600_000),
        },
      })
    }

    const aggregate = await prisma.marketFeedback.findMany({ where: { toolId } })
    const average =
      aggregate.reduce((sum, item) => sum + item.starRating, 0) / Math.max(aggregate.length, 1)
    console.log(`Seeded ${tool.name}: ${aggregate.length} reviews, avg ${average.toFixed(1)}`)
  }

  const realUsers = await prisma.user.findMany({
    where: { supabaseUserId: { not: { startsWith: 'seed-feedback-' } } },
    take: 1,
  })

  if (realUsers[0]) {
    await prisma.marketFeedback.upsert({
      where: {
        userId_toolId: { userId: realUsers[0].id, toolId: TOOL_ID_KIMI },
      },
      create: {
        userId: realUsers[0].id,
        toolId: TOOL_ID_KIMI,
        vote: 'up',
        starRating: 5,
        selectedTags: ['chinese_friendly', 'worth_saving'],
        updatedAt: new Date(),
      },
      update: {
        vote: 'up',
        starRating: 5,
        selectedTags: ['chinese_friendly', 'worth_saving'],
        updatedAt: new Date(),
      },
    })
    console.log(
      `Linked Kimi review to your account: ${realUsers[0].email ?? realUsers[0].nickname}`,
    )
  }
}

await main()
await prisma.$disconnect()
