import 'server-only'

import { prisma } from '@/server/db/prisma'
import type { MarketSubmission } from '@/shared/market-types'

function toMarketSubmission(item: {
  id: string
  name: string
  url: string
  description: string
  tags: string[]
  submittedAt: Date
  status: string
}): MarketSubmission {
  return {
    id: item.id,
    name: item.name,
    url: item.url,
    description: item.description,
    tags: item.tags,
    submittedAt: item.submittedAt.getTime(),
    status: item.status as 'review' | 'listed',
  }
}

export async function listMarketSubmissions(userId: string): Promise<MarketSubmission[]> {
  const list = await prisma.marketSubmission.findMany({
    where: { userId },
    orderBy: { submittedAt: 'desc' },
  })
  return list.map(toMarketSubmission)
}

export async function createMarketSubmission(
  userId: string,
  input: {
    name: string
    url: string
    description: string
    tags: string[]
  },
) {
  await prisma.marketSubmission.create({
    data: {
      userId,
      name: input.name.trim(),
      url: input.url.trim(),
      description: input.description.trim(),
      tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
    },
  })
  return listMarketSubmissions(userId)
}
