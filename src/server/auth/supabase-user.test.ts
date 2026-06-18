import assert from 'node:assert/strict'
import test from 'node:test'

import type { User } from '@supabase/supabase-js'
import { resolveSupabaseUserProfile } from '@/server/auth/supabase-user'

function buildUser(overrides: Partial<User>): User {
  return {
    id: 'supabase-user-1',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T01:02:03.000Z',
    ...overrides,
  } as User
}

test('resolveSupabaseUserProfile reads GitHub metadata profile fields', () => {
  const profile = resolveSupabaseUserProfile(
    buildUser({
      email: 'nirvazure@gmail.com',
      role: 'authenticated',
      app_metadata: { provider: 'github' },
      user_metadata: {
        name: 'Nirvazure',
        avatar_url: 'https://example.com/avatar.png',
        bio: 'Builder',
        website: 'https://nirvazure.cn',
        company: 'DoraPocket',
      },
      last_sign_in_at: '2026-01-02T03:04:05.000Z',
    }),
  )

  assert.equal(profile.nickname, 'Nirvazure')
  assert.equal(profile.avatarSrc, 'https://example.com/avatar.png')
  assert.equal(profile.bio, 'Builder')
  assert.equal(profile.website, 'https://nirvazure.cn')
  assert.equal(profile.company, 'DoraPocket')
  assert.equal(profile.authProvider, 'github')
  assert.equal(profile.authRole, 'authenticated')
  assert.equal(profile.authCreatedAt?.toISOString(), '2026-01-01T01:02:03.000Z')
  assert.equal(profile.lastSignInAt?.toISOString(), '2026-01-02T03:04:05.000Z')
})

test('resolveSupabaseUserProfile falls back to identity data for profile fields', () => {
  const profile = resolveSupabaseUserProfile(
    buildUser({
      user_metadata: {
        name: 'Nirvazure',
      },
      identities: [
        {
          id: 'identity-1',
          identity_id: 'identity-1',
          user_id: 'supabase-user-1',
          identity_data: {
            bio: 'Identity bio',
            blog: 'https://blog.example.com',
            company: 'Identity company',
          },
          provider: 'github',
          created_at: '2026-01-01T01:02:03.000Z',
          updated_at: '2026-01-01T01:02:03.000Z',
          last_sign_in_at: '2026-01-02T03:04:05.000Z',
        },
      ],
    }),
  )

  assert.equal(profile.bio, 'Identity bio')
  assert.equal(profile.website, 'https://blog.example.com')
  assert.equal(profile.company, 'Identity company')
})

test('resolveSupabaseUserProfile falls back to identity provider', () => {
  const profile = resolveSupabaseUserProfile(
    buildUser({
      app_metadata: {},
      identities: [
        {
          id: 'identity-1',
          identity_id: 'identity-1',
          user_id: 'supabase-user-1',
          identity_data: {},
          provider: 'google',
          created_at: '2026-01-01T01:02:03.000Z',
          updated_at: '2026-01-01T01:02:03.000Z',
        },
      ],
    }),
  )

  assert.equal(profile.authProvider, 'google')
})

test('resolveSupabaseUserProfile normalizes empty and invalid profile values', () => {
  const profile = resolveSupabaseUserProfile(
    buildUser({
      role: '   ',
      created_at: 'not-a-date',
      last_sign_in_at: '',
      app_metadata: { provider: '   ' },
      user_metadata: {
        name: 'Nirvazure',
        bio: '   ',
        website: 42,
        company: null,
      },
    }),
  )

  assert.equal(profile.bio, null)
  assert.equal(profile.website, null)
  assert.equal(profile.company, null)
  assert.equal(profile.authProvider, null)
  assert.equal(profile.authRole, null)
  assert.equal(profile.authCreatedAt, null)
  assert.equal(profile.lastSignInAt, null)
})
