import 'server-only'

import type { User } from '@supabase/supabase-js'

function asTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function firstIdentityData(user: User): Record<string, unknown> | null {
  const identity = Array.isArray(user.identities) ? user.identities[0] : null
  return asRecord(identity?.identity_data)
}

function firstStringFromRecords(
  records: Array<Record<string, unknown> | null>,
  keys: string[],
): string | null {
  for (const record of records) {
    if (!record) continue
    for (const key of keys) {
      const value = asTrimmedString(record[key])
      if (value) return value
    }
  }
  return null
}

function parseOptionalDate(value: unknown): Date | null {
  const raw = asTrimmedString(value)
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

export function resolveSupabaseUserProfile(user: User) {
  const metadata = user.user_metadata
  const identityData = firstIdentityData(user)
  const nickname =
    (typeof metadata?.nickname === 'string' && metadata.nickname.trim()) ||
    (typeof metadata?.name === 'string' && metadata.name.trim()) ||
    (typeof metadata?.full_name === 'string' && metadata.full_name.trim()) ||
    '用户'

  const avatarSrc =
    (typeof metadata?.avatar_url === 'string' && metadata.avatar_url.trim()) ||
    (typeof metadata?.picture === 'string' && metadata.picture.trim()) ||
    null

  const identityProvider = Array.isArray(user.identities)
    ? asTrimmedString(user.identities[0]?.provider)
    : null

  return {
    supabaseUserId: user.id,
    email: user.email?.trim() || null,
    nickname,
    avatarSrc,
    bio: firstStringFromRecords([metadata, identityData], ['bio']),
    website: firstStringFromRecords([metadata, identityData], ['website', 'blog']),
    company: firstStringFromRecords([metadata, identityData], ['company']),
    authCreatedAt: parseOptionalDate(user.created_at),
    lastSignInAt: parseOptionalDate(user.last_sign_in_at),
    authRole: asTrimmedString(user.role),
    authProvider: asTrimmedString(user.app_metadata?.provider) ?? identityProvider,
  }
}
