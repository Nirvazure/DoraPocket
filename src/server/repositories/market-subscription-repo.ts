import 'server-only'

import { prisma } from '@/server/db/prisma'
import type { MarketSubscriptionRecord } from '@/shared/market/market-types'
import { recordToolSubscribed } from '@/server/repositories/tool-activity-repo'

function toSubscription(item: {
  toolId: string
  active: boolean
  subscribedAt: Date
}): MarketSubscriptionRecord {
  return {
    toolId: item.toolId,
    active: item.active,
    subscribedAt: item.subscribedAt.getTime(),
  }
}

export async function listMarketSubscriptions(userId: string): Promise<MarketSubscriptionRecord[]> {
  const list = await prisma.marketSubscription.findMany({ where: { userId } })
  return list.map(toSubscription)
}

export async function setToolSubscription(userId: string, toolId: string, active: boolean) {
  if (active) {
    await recordToolSubscribed(userId, toolId)
  }
  await prisma.marketSubscription.upsert({
    where: { userId_toolId: { userId, toolId } },
    create: { userId, toolId, active, subscribedAt: new Date() },
    update: { active, subscribedAt: new Date() },
  })
  return listMarketSubscriptions(userId)
}
