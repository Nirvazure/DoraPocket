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

type PendingToolRecord = {
  id: string
  url: string | null
  iconImageUrl: string | null
  embeddedAt: Date | null
}

type SyncPendingToolsDeps = {
  findCandidateTools: (take: number) => Promise<PendingToolRecord[]>
  syncArtifacts: (toolId: string) => Promise<{ embeddingSynced: boolean; faviconSynced: boolean }>
  isSyncedFaviconUrl: (url: string | null | undefined) => boolean
}

export async function syncPendingTools(
  batchSize: number,
  deps?: Partial<SyncPendingToolsDeps>,
): Promise<SyncPendingToolsResult> {
  const resolvedDeps: SyncPendingToolsDeps = {
    findCandidateTools:
      deps?.findCandidateTools ??
      ((take) =>
        prisma.tool.findMany({
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
          take,
          orderBy: { updatedAt: 'asc' },
        })),
    syncArtifacts: deps?.syncArtifacts ?? syncToolArtifacts,
    isSyncedFaviconUrl: deps?.isSyncedFaviconUrl ?? isSupabaseMarketAssetUrl,
  }

  const needsFavicon = (url: string | null, iconImageUrl: string | null): url is string => {
    return Boolean(url) && !resolvedDeps.isSyncedFaviconUrl(iconImageUrl)
  }

  const result: SyncPendingToolsResult = {
    scanned: 0,
    embeddingSynced: 0,
    faviconSynced: 0,
    errors: 0,
  }

  const tools = await resolvedDeps.findCandidateTools(batchSize * 3)

  const pending = tools
    .filter((tool) => !tool.embeddedAt || needsFavicon(tool.url, tool.iconImageUrl))
    .slice(0, batchSize)

  for (const tool of pending) {
    result.scanned += 1

    try {
      const sync = await resolvedDeps.syncArtifacts(tool.id)
      if (sync.embeddingSynced) result.embeddingSynced += 1
      if (sync.faviconSynced) result.faviconSynced += 1
    } catch (error) {
      result.errors += 1
      console.error('[syncPendingTools]', tool.id, error)
    }
  }

  return result
}
