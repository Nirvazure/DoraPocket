import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

let authenticated = false
mock.module('@/server/auth/dal', {
  namedExports: { verifySession: async () => (authenticated ? { user: { id: 'user-1' } } : null) },
})
const { POST } = await import('./route')

test('legacy import requires authentication and never accepts old snapshots', async () => {
  assert.equal((await POST()).status, 401)
  authenticated = true
  const response = await POST()
  assert.equal(response.status, 410)
  assert.deepEqual(await response.json(), { message: '旧版本地数据导入已停用。' })
})
