import 'server-only'

import { prisma } from '@/server/db/prisma'
import { createImportedToolId } from '@/server/repositories/tool-repo'
import type { MarketSubmission } from '@/shared/market-types'

function toMarketSubmission(item: {
  id: string
  toolId: string | null
  name: string
  url: string
  description: string
  tags: string[]
  submittedAt: Date
  status: string
  duplicateSimilarity: number | null
}): MarketSubmission {
  return {
    id: item.id,
    toolId: item.toolId,
    name: item.name,
    url: item.url,
    description: item.description,
    tags: item.tags,
    submittedAt: item.submittedAt.getTime(),
    status: item.status as MarketSubmission['status'],
    duplicateSimilarity: item.duplicateSimilarity,
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
  const url = input.url.trim()
  await prisma.marketSubmission.create({
    data: {
      userId,
      toolId: createImportedToolId(url),
      name: input.name.trim(),
      url,
      description: input.description.trim(),
      tags: input.tags.map((tag) => tag.trim()).filter(Boolean),
    },
  })
  return listMarketSubmissions(userId)
}
