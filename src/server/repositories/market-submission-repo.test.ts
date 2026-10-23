import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const created: Array<{ data: Record<string, unknown> }> = []
mock.module('@/server/db/prisma', {
  namedExports: {
    prisma: {
      marketSubmission: {
        create: async (args: { data: Record<string, unknown> }) => {
          created.push(args)
        },
        findMany: async () => [],
      },
    },
  },
})
mock.module('@/server/repositories/tool-repo', {
  namedExports: { createImportedToolId: () => 'tool-1' },
})
const { createMarketSubmission } = await import('./market-submission-repo')

test('a newly listed tool records listed status without changing the submission return shape', async () => {
  const result = await createMarketSubmission('user-1', {
    name: 'Example',
    url: 'https://example.com',
    description: 'A tool',
    tags: ['ai'],
  })
  assert.deepEqual(result, [])
  assert.equal(created[0].data.status, 'listed')
  assert.equal(created[0].data.toolId, 'tool-1')
})
