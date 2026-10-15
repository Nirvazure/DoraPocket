import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

mock.module('@/server/auth/dal', {
  namedExports: { getCurrentUserOrNull: async () => ({ id: 'owner' }) },
})
mock.module('@/server/db/prisma', {
  namedExports: {
    prisma: {
      tool: {
        findMany: async (args: {
          include?: { marketFeedback?: unknown; toolActivities?: unknown }
        }) => [
          {
            id: 'demo',
            name: 'Demo',
            url: 'https://example.com',
            description: 'A tool',
            category: 'other',
            tags: [],
            iconUrl: null,
            status: 'active',
            pricingModel: 'unknown',
            requiresAuth: null,
            platform: 'unknown',
            createdByUserId: 'owner',
            ...(args.include?.marketFeedback
              ? { marketFeedback: [{ vote: 'up' }, { vote: 'down' }, { vote: 'up' }] }
              : {}),
            ...(args.include?.toolActivities ? { toolActivities: [{ saves: 3, opens: 7 }] } : {}),
          },
        ],
      },
    },
  },
})
const { GET } = await import('./route')

test('batch hydration includes real feedback and activity aggregates with ownership', async () => {
  const response = await GET(new Request('https://example.com/api/market/tools/batch?ids=demo'))
  assert.equal(response.status, 200)
  const [tool] = await response.json()
  assert.deepEqual(tool.ratingSummary, { upvotes: 2, downvotes: 1, score: 1 })
  assert.deepEqual(tool.usageStats, { saves: 3, opens: 7 })
  assert.equal(tool.isOwnedByViewer, true)
})
