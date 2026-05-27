import { getMarketAssetsBucket } from '@/lib/supabase/config'
import { createSupabaseAdminClient } from '@/lib/supabase/admin-client'
import { buildMarketAssetPublicUrl } from '@/shared/market-asset-url'

export async function uploadMarketAsset(
  objectKey: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const bucket = getMarketAssetsBucket()
  const normalizedKey = objectKey.replace(/^\/+/, '')
  const supabase = createSupabaseAdminClient()

  const { error } = await supabase.storage.from(bucket).upload(normalizedKey, body, {
    contentType,
    upsert: true,
  })

  if (error) {
    throw new Error(`Failed to upload market asset ${normalizedKey}: ${error.message}`)
  }

  const publicUrl = buildMarketAssetPublicUrl(normalizedKey)
  if (!publicUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required to build market asset URL')
  }
  return publicUrl
}
