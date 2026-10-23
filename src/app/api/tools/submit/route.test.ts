import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

let submissionInput: Record<string, unknown> | null = null
let toolUpserted = false
mock.module('@/server/auth/dal', {
  namedExports: { verifySession: async () => ({ user: { id: 'user-1' } }) },
})
mock.module('@/server/repositories/tool-repo', {
  namedExports: {
    upsertImportedTool: async () => {
      toolUpserted = true
    },
  },
})
mock.module('@/server/repositories/market-submission-repo', {
  namedExports: {
    createMarketSubmission: async (_userId: string, input: Record<string, unknown>) => {
      submissionInput = input
      return [{ id: 'submission-1', status: 'listed' }]
    },
  },
})
const { POST } = await import('./route')

test('main tool submission lists the tool before recording a listed activity', async () => {
  const response = await POST(
    new Request('https://example.com/api/tools/submit', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Example',
        url: 'https://example.com',
        description: 'Useful tool',
        tags: ['ai'],
      }),
    }),
  )
  assert.equal(response.status, 200)
  assert.equal(toolUpserted, true)
  assert.equal(submissionInput?.name, 'Example')
  assert.deepEqual(await response.json(), [{ id: 'submission-1', status: 'listed' }])
})
