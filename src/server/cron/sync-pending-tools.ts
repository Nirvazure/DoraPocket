import 'server-only'

import { syncToolArtifacts } from '@/server/cron/sync-tool-artifacts'
import { prisma } from '@/server/db/prisma'
import { isSupabaseMarketAssetUrl } from '@/shared/market-asset-url'

export type SyncPendingToolsResult = {
  scanned: number
  embeddingSynced: number
  faviconSynced: number
  errors: number
}

function needsFaviconSync(url: string | null, iconImageUrl: string | null): url is string {
  return Boolean(url) && !isSupabaseMarketAssetUrl(iconImageUrl)
}

export async function syncPendingTools(batchSize: number): Promise<SyncPendingToolsResult> {
  const result: SyncPendingToolsResult = {
    scanned: 0,
    embeddingSynced: 0,
    faviconSynced: 0,
    errors: 0,
  }

  const tools = await prisma.tool.findMany({
    where: {
      status: 'active',
      OR: [{ embeddedAt: null }, { url: { not: null } }],
    },
    select: {
      id: true,
      url: true,
      iconImageUrl: true,
      embeddedAt: true,
    },
    take: batchSize * 3,
    orderBy: { updatedAt: 'asc' },
  })

  const pending = tools
    .filter((tool) => !tool.embeddedAt || needsFaviconSync(tool.url, tool.iconImageUrl))
    .slice(0, batchSize)

  for (const tool of pending) {
    result.scanned += 1

    try {
      const sync = await syncToolArtifacts(tool.id)
      if (sync.embeddingSynced) result.embeddingSynced += 1
      if (sync.faviconSynced) result.faviconSynced += 1
    } catch (error) {
      result.errors += 1
      console.error('[syncPendingTools]', tool.id, error)
    }
  }

  return result
}
