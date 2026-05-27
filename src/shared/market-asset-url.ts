import { SUPABASE_STORAGE_BUCKET_MARKET } from '@/constant'

export function getMarketAssetsBucketName(): string {
  return SUPABASE_STORAGE_BUCKET_MARKET
}

export function getSupabaseProjectUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  return value || null
}

export function buildMarketAssetPublicUrl(objectKey: string): string | null {
  const base = getSupabaseProjectUrl()
  if (!base) return null
  const bucket = getMarketAssetsBucketName()
  const normalizedKey = objectKey.replace(/^\/+/, '')
  return `${base}/storage/v1/object/public/${bucket}/${normalizedKey}`
}

export function isSupabaseMarketAssetUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const base = getSupabaseProjectUrl()
  if (!base) return url.includes('/storage/v1/object/public/')
  const bucket = getMarketAssetsBucketName()
  return url.startsWith(`${base}/storage/v1/object/public/${bucket}/`)
}

export function marketIconKeyForSeed(seedId: string): string {
  return `market-favicons/${seedId}`
}

export function marketIconKeyForImportedTool(toolId: string, ext: string): string {
  return `market-favicons/imported/${toolId}.${ext}`
}
