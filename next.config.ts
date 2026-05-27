import type { NextConfig } from 'next'

function resolveSupabaseHostname(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!raw) return null
  try {
    return new URL(raw).hostname
  } catch {
    return null
  }
}

const supabaseHostname = resolveSupabaseHostname()

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
}

export default nextConfig
