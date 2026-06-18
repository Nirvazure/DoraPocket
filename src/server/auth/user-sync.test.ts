import assert from 'node:assert/strict'
import test from 'node:test'

import type { User } from '@supabase/supabase-js'
import type { TestContext } from 'node:test'

process.env.DATABASE_URL ??= 'postgresql://user:password@localhost:5432/dorapocket_test'

const {
  appUserSelect,
  baseAppUserSelect,
  ensureAppUserFromSupabaseUser,
  isMissingAuthProfileColumnError,
} = await import('@/server/auth/user-sync')
const { prisma } = await import('@/server/db/prisma')
const userDelegate = prisma.user

type UpsertArgs = Parameters<typeof userDelegate.upsert>[0]
type UpsertResult = Awaited<ReturnType<typeof userDelegate.upsert>>

function replaceUserUpsert(
  t: TestContext,
  implementation: (args: UpsertArgs) => Promise<UpsertResult>,
): void {
  const originalUpsert = userDelegate.upsert
  userDelegate.upsert = implementation as unknown as typeof userDelegate.upsert
  t.after(() => {
    userDelegate.upsert = originalUpsert
  })
}

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'supabase-user-1',
    app_metadata: { provider: 'github' },
    user_metadata: {
      name: 'Nirvazure',
      avatar_url: 'https://example.com/avatar.png',
      bio: 'Builder',
      website: 'https://nirvazure.cn',
      company: 'DoraPocket',
    },
    aud: 'authenticated',
    email: 'nirvazure@gmail.com',
    role: 'authenticated',
    created_at: '2026-01-01T01:02:03.000Z',
    last_sign_in_at: '2026-01-02T03:04:05.000Z',
    ...overrides,
  } as User
}

function buildFullAppUser() {
  return {
    id: 'app-user-1',
    supabaseUserId: 'supabase-user-1',
    email: 'nirvazure@gmail.com',
    nickname: 'Nirvazure',
    avatarSrc: 'https://example.com/avatar.png',
    bio: 'Builder',
    website: 'https://nirvazure.cn',
    company: 'DoraPocket',
    authCreatedAt: new Date('2026-01-01T01:02:03.000Z'),
    lastSignInAt: new Date('2026-01-02T03:04:05.000Z'),
    authRole: 'authenticated',
    authProvider: 'github',
    createdAt: new Date('2026-01-03T01:02:03.000Z'),
    updatedAt: new Date('2026-01-04T01:02:03.000Z'),
  }
}

function buildBaseAppUser() {
  return {
    id: 'app-user-1',
    supabaseUserId: 'supabase-user-1',
    email: 'nirvazure@gmail.com',
    nickname: 'Nirvazure',
    avatarSrc: 'https://example.com/avatar.png',
    createdAt: new Date('2026-01-03T01:02:03.000Z'),
    updatedAt: new Date('2026-01-04T01:02:03.000Z'),
  }
}

test('ensureAppUserFromSupabaseUser returns full profile fields when full upsert succeeds', async (t) => {
  const fullAppUser = buildFullAppUser()
  const calls: UpsertArgs[] = []

  replaceUserUpsert(t, async (args: UpsertArgs) => {
    calls.push(args)
    return fullAppUser as UpsertResult
  })

  const appUser = await ensureAppUserFromSupabaseUser(buildUser())

  assert.deepEqual(appUser, fullAppUser)
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0]?.select, appUserSelect)
  assert.equal(calls[0]?.create.bio, 'Builder')
  assert.equal(calls[0]?.update.bio, 'Builder')
})

test('ensureAppUserFromSupabaseUser falls back to base upsert when auth profile columns are missing', async (t) => {
  const baseAppUser = buildBaseAppUser()
  const calls: UpsertArgs[] = []
  const missingBioColumnError = new Error(
    'The column `bio` of relation `User` does not exist in the current database.',
  )

  replaceUserUpsert(t, async (args: UpsertArgs) => {
    calls.push(args)
    if (calls.length === 1) {
      throw missingBioColumnError
    }
    return baseAppUser as UpsertResult
  })

  const appUser = await ensureAppUserFromSupabaseUser(buildUser())

  assert.equal(calls.length, 2)
  assert.deepEqual(calls[0]?.select, appUserSelect)
  assert.deepEqual(calls[1]?.select, baseAppUserSelect)
  assert.equal('bio' in calls[1]!.create, false)
  assert.equal('bio' in calls[1]!.update, false)
  assert.deepEqual(appUser, {
    ...baseAppUser,
    bio: null,
    website: null,
    company: null,
    authCreatedAt: null,
    lastSignInAt: null,
    authRole: null,
    authProvider: null,
  })
})

test('ensureAppUserFromSupabaseUser rethrows non-missing-column errors', async (t) => {
  const connectionError = new Error('connection refused')

  replaceUserUpsert(t, async () => {
    throw connectionError
  })

  await assert.rejects(ensureAppUserFromSupabaseUser(buildUser()), connectionError)
})

test('isMissingAuthProfileColumnError recognizes postgres undefined column errors', () => {
  assert.equal(isMissingAuthProfileColumnError({ code: '42703', message: 'column missing' }), true)
  assert.equal(
    isMissingAuthProfileColumnError({
      message: 'The column `bio` of relation `User` does not exist in the current database.',
    }),
    true,
  )
  assert.equal(isMissingAuthProfileColumnError(new Error('connection refused')), false)
})
