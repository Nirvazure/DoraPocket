import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

let exchangeFails = false
let userMissing = false
let synced = 0
mock.module('@/lib/supabase/server', {
  namedExports: {
    createSupabaseServerClient: async () => ({
      auth: {
        exchangeCodeForSession: async () => ({
          error: exchangeFails ? new Error('private details') : null,
        }),
        getUser: async () => ({
          data: { user: userMissing ? null : { id: 'user-a' } },
          error: null,
        }),
      },
    }),
  },
})
mock.module('@/server/auth/user-sync', {
  namedExports: {
    ensureAppUserFromSupabaseUser: async () => {
      synced++
    },
  },
})
const { GET } = await import('./route')

test('callback verifies the user, synchronizes the app account and redirects locally', async () => {
  const response = await GET(
    new Request('https://dora.example/api/auth/callback?code=test&next=%2Fmarket'),
  )
  assert.equal(response.headers.get('location'), 'https://dora.example/market')
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal(synced, 1)
  const unsafe = await GET(
    new Request('https://dora.example/api/auth/callback?code=test&next=%2F%2Fevil.example'),
  )
  assert.equal(unsafe.headers.get('location'), 'https://dora.example/analyse')
})

test('callback rejects missing codes, invalid sessions and exchange failures without exposing details', async () => {
  const missing = await GET(new Request('https://dora.example/api/auth/callback'))
  assert.equal(
    missing.headers.get('location'),
    'https://dora.example/login?error=oauth_callback_failed',
  )
  userMissing = true
  const noUser = await GET(new Request('https://dora.example/api/auth/callback?code=test'))
  assert.equal(noUser.headers.get('location'), 'https://dora.example/login?error=session')
  exchangeFails = true
  const failed = await GET(new Request('https://dora.example/api/auth/callback?code=test'))
  assert.equal(
    failed.headers.get('location'),
    'https://dora.example/login?error=oauth_callback_failed',
  )
})
