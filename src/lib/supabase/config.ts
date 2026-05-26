export function getSupabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!value) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  return value
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

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000'
}

export function getAvatarBucket() {
  const value = process.env.SUPABASE_STORAGE_BUCKET_AVATARS?.trim()
  if (!value) {
    throw new Error('SUPABASE_STORAGE_BUCKET_AVATARS is required')
  }
  return value
}

export function getMarketAssetsBucket() {
  const value = process.env.SUPABASE_STORAGE_BUCKET_MARKET?.trim()
  if (!value) {
    throw new Error('SUPABASE_STORAGE_BUCKET_MARKET is required')
  }
  return value
}
