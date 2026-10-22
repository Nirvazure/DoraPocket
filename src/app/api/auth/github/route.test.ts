import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

let redirectTo = ''
let fails = false
mock.module('@/lib/supabase/server', {
  namedExports: {
    createSupabaseServerClient: async () => ({
      auth: {
        signInWithOAuth: async (input: { provider: string; options: { redirectTo: string } }) => {
          assert.equal(input.provider, 'github')
          redirectTo = input.options.redirectTo
          if (fails) throw new Error('private upstream details')
          return { data: { url: 'https://auth.example/authorize' }, error: null }
        },
      },
    }),
  },
})
const { GET } = await import('./route')

test('server OAuth uses the current domain and a safe local return path', async () => {
  for (const origin of [
    'http://localhost:3000',
    'https://preview.example',
    'https://dora.example',
  ]) {
    const response = await GET(new Request(`${origin}/api/auth/github?next=%2Fmarket%3Fq%3Dwrite`))
    assert.equal(response.headers.get('location'), 'https://auth.example/authorize')
    const callback = new URL(redirectTo)
    assert.equal(callback.origin, origin)
    assert.equal(callback.pathname, '/api/auth/callback')
    assert.equal(callback.searchParams.get('next'), '/market?q=write')
  }
  await GET(new Request('https://dora.example/api/auth/github?next=%2F%2Fevil.example'))
  assert.equal(new URL(redirectTo).searchParams.get('next'), '/analyse')
})

test('server OAuth returns a friendly error without upstream details', async () => {
  fails = true
  const response = await GET(new Request('https://dora.example/api/auth/github'))
  assert.equal(
    response.headers.get('location'),
    'https://dora.example/login?error=oauth_start_failed',
  )
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
})
