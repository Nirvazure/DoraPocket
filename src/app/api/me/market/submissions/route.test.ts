import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

mock.module('@/server/auth/dal', {
  namedExports: { verifySession: async () => ({ user: { id: 'user-1' } }) },
})
mock.module('@/server/repositories/market-submission-repo', {
  namedExports: {
    listMarketSubmissions: async () => [{ id: 'old-submission', status: 'duplicate' }],
  },
})
const route = await import('./route')

test('historical submissions remain readable without a standalone submission endpoint', async () => {
  const response = await route.GET()
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), [{ id: 'old-submission', status: 'duplicate' }])
  assert.equal('POST' in route, false)
})
