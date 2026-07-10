import { SUPABASE_STORAGE_BUCKET_AVATARS } from '@/constant'
import { getMarketAssetsBucketName } from '@/shared/market/market-asset-url'

export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!value) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  return value
}

export function isSupabasePublicConfigAvailable() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
  )
}

export function getSupabasePublishableKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!value) {
    throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required')
  }
  return value
}

export function getSupabaseSecretKey() {
  const value = process.env.SUPABASE_SECRET_KEY?.trim()
  if (!value) {
    throw new Error('SUPABASE_SECRET_KEY is required')
  }
  return value
}

export function getAvatarBucket() {
  return SUPABASE_STORAGE_BUCKET_AVATARS
}

export function getMarketAssetsBucket() {
  return getMarketAssetsBucketName()
}
