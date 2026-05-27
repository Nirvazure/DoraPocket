import 'server-only'

import { syncToolFavicon } from '@/server/market/tool-favicon'
import { prisma } from '@/server/db/prisma'
import { syncToolEmbedding } from '@/server/retrieval/tool-embedding'
import { isSupabaseMarketAssetUrl } from '@/shared/market-asset-url'

function needsFaviconSync(url: string | null, iconImageUrl: string | null): url is string {
  return Boolean(url) && !isSupabaseMarketAssetUrl(iconImageUrl)
}

const CONTENT_FIELDS = [
  'name',
  'description',
  'category',
  'tags',
  'capabilities',
  'recommendedFor',
] as const

type ToolWebhookRecord = {
  id: string
  status: string
  url: string | null
  iconImageUrl: string | null
  embeddedAt: string | null
  name?: string
  description?: string
  category?: string
  tags?: string[]
  capabilities?: string[]
  recommendedFor?: string[]
}

export function toolRecordNeedsArtifactSync(
  type: 'INSERT' | 'UPDATE',
  record: ToolWebhookRecord,
  oldRecord?: ToolWebhookRecord | null,
): boolean {
  if (record.status !== 'active') return false
  if (!record.embeddedAt) return true
  if (needsFaviconSync(record.url, record.iconImageUrl)) return true
  if (type === 'INSERT') return true
  if (!oldRecord) return false

  return CONTENT_FIELDS.some(
    (field) => JSON.stringify(record[field]) !== JSON.stringify(oldRecord[field]),
  )
}

export async function syncToolArtifacts(toolId: string): Promise<{
  embeddingSynced: boolean
  faviconSynced: boolean
}> {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: {
      id: true,
      status: true,
      url: true,
      iconImageUrl: true,
      embeddedAt: true,
    },
  })
  if (!tool || tool.status !== 'active') {
    return { embeddingSynced: false, faviconSynced: false }
  }

  const beforeEmbeddedAt = tool.embeddedAt
  await syncToolEmbedding(tool.id)

  const after = await prisma.tool.findUnique({
    where: { id: tool.id },
    select: { embeddedAt: true, iconImageUrl: true },
  })
  const embeddingSynced = Boolean(after?.embeddedAt && after.embeddedAt !== beforeEmbeddedAt)

  let faviconSynced = false
  if (needsFaviconSync(tool.url, after?.iconImageUrl ?? tool.iconImageUrl)) {
    await syncToolFavicon(tool.id, tool.url)
    const iconAfter = await prisma.tool.findUnique({
      where: { id: tool.id },
      select: { iconImageUrl: true },
    })
    faviconSynced = isSupabaseMarketAssetUrl(iconAfter?.iconImageUrl)
  }

  return { embeddingSynced, faviconSynced }
}
