import 'server-only'

import { syncToolFavicon } from '@/server/market/tool-favicon'
import { prisma } from '@/server/db/prisma'
import { syncToolEmbedding } from '@/server/retrieval/tool-embedding'
import { isSupabaseMarketAssetUrl } from '@/shared/market/market-asset-url'

type ToolArtifactRecord = {
  id: string
  status: string
  url: string | null
  iconUrl: string | null
  embeddedAt: Date | null
}

type SyncToolArtifactsDeps = {
  findTool: (toolId: string) => Promise<ToolArtifactRecord | null>
  readToolArtifacts: (
    toolId: string,
  ) => Promise<{ embeddedAt: Date | null; iconUrl: string | null } | null>
  syncEmbedding: (toolId: string) => Promise<void>
  syncFavicon: (toolId: string, siteUrl: string) => Promise<void>
  isSyncedFaviconUrl: (url: string | null | undefined) => boolean
}

function needsFaviconSync(url: string | null, iconUrl: string | null): url is string {
  return Boolean(url) && !iconUrl?.trim()
}

const CONTENT_FIELDS = ['name', 'description', 'category', 'tags'] as const

type ToolWebhookRecord = {
  id: string
  status: string
  url: string | null
  iconUrl: string | null
  name?: string
  description?: string
  category?: string
  tags?: string[]
}

export function toolRecordNeedsArtifactSync(
  type: 'INSERT' | 'UPDATE',
  record: ToolWebhookRecord,
  oldRecord?: ToolWebhookRecord | null,
): boolean {
  if (record.status !== 'active') return false
  if (type === 'INSERT' || oldRecord?.status !== 'active') return true
  if (needsFaviconSync(record.url, record.iconUrl) && record.url !== oldRecord?.url) return true
  if (!oldRecord) return false

  return CONTENT_FIELDS.some(
    (field) => JSON.stringify(record[field]) !== JSON.stringify(oldRecord[field]),
  )
}

export async function syncToolArtifacts(toolId: string): Promise<{
  embeddingSynced: boolean
  faviconSynced: boolean
}>
export async function syncToolArtifacts(
  toolId: string,
  deps: Partial<SyncToolArtifactsDeps>,
): Promise<{
  embeddingSynced: boolean
  faviconSynced: boolean
}>
export async function syncToolArtifacts(
  toolId: string,
  deps?: Partial<SyncToolArtifactsDeps>,
): Promise<{
  embeddingSynced: boolean
  faviconSynced: boolean
}> {
  const resolvedDeps: SyncToolArtifactsDeps = {
    findTool:
      deps?.findTool ??
      (async (id) => {
        const tool = await prisma.tool.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            url: true,
            iconUrl: true,
            index: { select: { embeddedAt: true } },
          },
        })
        return tool ? { ...tool, embeddedAt: tool.index?.embeddedAt ?? null } : null
      }),
    readToolArtifacts:
      deps?.readToolArtifacts ??
      (async (id) => {
        const tool = await prisma.tool.findUnique({
          where: { id },
          select: { index: { select: { embeddedAt: true } }, iconUrl: true },
        })
        return tool ? { embeddedAt: tool.index?.embeddedAt ?? null, iconUrl: tool.iconUrl } : null
      }),
    syncEmbedding: deps?.syncEmbedding ?? syncToolEmbedding,
    syncFavicon: deps?.syncFavicon ?? syncToolFavicon,
    isSyncedFaviconUrl: deps?.isSyncedFaviconUrl ?? isSupabaseMarketAssetUrl,
  }

  const needsFavicon = (url: string | null, iconUrl: string | null): url is string => {
    return Boolean(url) && !iconUrl?.trim()
  }

  const tool = await resolvedDeps.findTool(toolId)
  if (!tool || tool.status !== 'active') {
    return { embeddingSynced: false, faviconSynced: false }
  }

  const beforeEmbeddedAt = tool.embeddedAt
  await resolvedDeps.syncEmbedding(tool.id)

  const after = await resolvedDeps.readToolArtifacts(tool.id)
  const embeddingSynced = Boolean(
    after?.embeddedAt && after.embeddedAt.getTime() !== beforeEmbeddedAt?.getTime(),
  )

  let faviconSynced = false
  if (needsFavicon(tool.url, after?.iconUrl ?? tool.iconUrl)) {
    await resolvedDeps.syncFavicon(tool.id, tool.url)
    const iconAfter = await resolvedDeps.readToolArtifacts(tool.id)
    faviconSynced = resolvedDeps.isSyncedFaviconUrl(iconAfter?.iconUrl)
  }

  return { embeddingSynced, faviconSynced }
}
