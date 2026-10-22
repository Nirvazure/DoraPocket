import 'server-only'

import { syncToolArtifacts } from '@/server/cron/sync-tool-artifacts'
import { prisma } from '@/server/db/prisma'
import {
  buildToolIndex,
  EMBEDDING_CONFIG,
  type ToolIndexFields,
} from '@/shared/market/tool-index-content'
import { isSupabaseMarketAssetUrl } from '@/shared/market/market-asset-url'

export type SyncPendingToolsResult = {
  scanned: number
  embeddingSynced: number
  faviconSynced: number
  errors: number
}

type PendingToolRecord = ToolIndexFields & {
  id: string
  url: string | null
  iconUrl: string | null
  index: { contentHash: string; embeddingModel: string | null; embeddedAt: Date | null } | null
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
      (() =>
        prisma.tool.findMany({
          where: {
            status: 'active',
          },
          select: {
            id: true,
            url: true,
            iconUrl: true,
            name: true,
            description: true,
            category: true,
            tags: true,
            index: { select: { contentHash: true, embeddingModel: true, embeddedAt: true } },
          },
          orderBy: { updatedAt: 'asc' },
        })),
    syncArtifacts: deps?.syncArtifacts ?? syncToolArtifacts,
    isSyncedFaviconUrl: deps?.isSyncedFaviconUrl ?? isSupabaseMarketAssetUrl,
  }

  const needsFavicon = (url: string | null, iconUrl: string | null): url is string => {
    return Boolean(url) && !iconUrl?.trim()
  }

  const result: SyncPendingToolsResult = {
    scanned: 0,
    embeddingSynced: 0,
    faviconSynced: 0,
    errors: 0,
  }

  const tools = await resolvedDeps.findCandidateTools(batchSize * 3)

  const config = EMBEDDING_CONFIG
  const missingIndexes = tools.filter(
    (tool) =>
      !tool.index?.embeddedAt ||
      tool.index.embeddingModel !== config.model ||
      tool.index.contentHash !== buildToolIndex(tool, config).contentHash,
  )
  const missingIndexIds = new Set(missingIndexes.map((tool) => tool.id))
  const missingIcons = tools.filter(
    (tool) => !missingIndexIds.has(tool.id) && needsFavicon(tool.url, tool.iconUrl),
  )
  const pending = [...missingIndexes, ...missingIcons].slice(0, batchSize)

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
