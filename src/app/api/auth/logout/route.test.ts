import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import { NextRequest } from 'next/server'

let cleared = 0
mock.module('@/server/auth/session', {
  namedExports: {
    clearSupabaseSession: async () => {
      cleared++
    },
  },
})

const { GET } = await import('./route')

test('logging out clears the session and returns to analysis', async () => {
  const response = await GET(new NextRequest('https://dora.example/api/auth/logout'))

  assert.equal(cleared, 1)
  assert.equal(response.headers.get('location'), 'https://dora.example/analyse')
})
