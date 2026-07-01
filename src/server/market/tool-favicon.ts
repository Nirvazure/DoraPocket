import { prisma } from '@/server/db/prisma'
import { uploadMarketAsset } from '@/server/storage/market-assets'
import {
  buildMarketAssetPublicUrl,
  isSupabaseMarketAssetUrl,
  marketIconKeyForImportedTool,
} from '@/shared/market/market-asset-url'

const FETCH_TIMEOUT_MS = 8_000
const MIN_FAVICON_BYTES = 64
const MAX_FAVICON_BYTES = 512 * 1024

type FaviconPayload = {
  buffer: Buffer
  contentType: string
  ext: string
}

function extensionForContentType(contentType: string): string {
  const normalized = contentType.toLowerCase()
  if (normalized.includes('svg')) return 'svg'
  if (normalized.includes('png')) return 'png'
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg'
  if (normalized.includes('webp')) return 'webp'
  if (normalized.includes('gif')) return 'gif'
  return 'ico'
}

async function fetchWithTimeout(url: string): Promise<Response | null> {
  try {
    return await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': 'DoraPocket/1.0 (+https://dorapocket.nirvazure.cn)' },
    })
  } catch {
    return null
  }
}

async function readFaviconResponse(response: Response): Promise<FaviconPayload | null> {
  if (!response.ok) return null
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) return null

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length < MIN_FAVICON_BYTES || buffer.length > MAX_FAVICON_BYTES) return null

  return {
    buffer,
    contentType,
    ext: extensionForContentType(contentType),
  }
}

async function fetchOriginFavicon(siteUrl: string): Promise<FaviconPayload | null> {
  const origin = new URL(siteUrl).origin
  const response = await fetchWithTimeout(`${origin}/favicon.ico`)
  if (!response) return null
  return readFaviconResponse(response)
}

async function fetchGoogleFavicon(siteUrl: string): Promise<FaviconPayload | null> {
  const hostname = new URL(siteUrl).hostname
  const response = await fetchWithTimeout(
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`,
  )
  if (!response) return null
  return readFaviconResponse(response)
}

export async function fetchSiteFavicon(siteUrl: string): Promise<FaviconPayload | null> {
  try {
    return (await fetchOriginFavicon(siteUrl)) ?? (await fetchGoogleFavicon(siteUrl))
  } catch {
    return null
  }
}

export async function syncToolFavicon(toolId: string, siteUrl: string): Promise<void> {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: { iconImageUrl: true },
  })
  if (!tool) return
  if (isSupabaseMarketAssetUrl(tool.iconImageUrl)) return

  const favicon = await fetchSiteFavicon(siteUrl)
  if (!favicon) return

  const objectKey = marketIconKeyForImportedTool(toolId, favicon.ext)
  const iconImageUrl = await uploadMarketAsset(objectKey, favicon.buffer, favicon.contentType)

  await prisma.tool.update({
    where: { id: toolId },
    data: {
      iconType: 'favicon',
      iconImageUrl,
      iconImageLocalPath: null,
    },
  })
}

export function resolveSeedIconUrl(objectKey: string | undefined): string | null {
  if (!objectKey) return null
  return buildMarketAssetPublicUrl(objectKey)
}
