import assert from 'node:assert/strict'
import { beforeEach, mock, test } from 'node:test'
import type { ToolItem, ToolMatch } from '@/shared/market/tool-registry'

const invokeModel =
  mock.fn<(prompt: string, systemPrompt: string, temperature: number) => Promise<string>>()
mock.module('server-only', { namedExports: {} })
mock.module(new URL('./model.ts', import.meta.url).href, {
  namedExports: { invokeModel },
})

const { judgeToolRecommendations } = await import('@/server/agent/tool-rerank')

const tool: ToolItem = {
  id: 'hub-tool',
  name: 'Hub Tool',
  icon: 'tool',
  url: 'https://hub.example.com',
  description: 'A tool in Tool Hub.',
  category: 'productivity',
  tags: ['task'],
  source: 'market',
  status: 'active',
  executionMode: 'external_link',
  pricingModel: 'free',
  requiresAuth: false,
  platform: 'web',
  capabilities: ['task'],
  recommendedFor: ['task'],
  trustSignals: { curated: true, official: false, communityVerified: false },
  ratingSummary: { upvotes: 0, downvotes: 0, score: 0 },
  usageStats: { saves: 0, opens: 0, subscriptions: 0 },
  subscriptionSupport: false,
}

const match: ToolMatch = {
  tool,
  score: 40,
  reason: 'Hub candidate',
  sourceLabel: 'market',
}

beforeEach(() => {
  invokeModel.mock.resetCalls()
  invokeModel.mock.mockImplementation(async () =>
    JSON.stringify({
      ranking: [{ toolId: 'hub-tool', reason: 'hub' }],
      externalSuggestions: [
        {
          title: 'Web Tool',
          url: 'https://web.example.com',
          reason: 'web',
          externalConfidence: 0.75,
        },
      ],
      preferExternal: false,
      hubInsufficient: false,
    }),
  )
})

test('market mode filters model-generated external suggestions', async () => {
  const result = await judgeToolRecommendations('task', [match], 'market')

  assert.deepEqual(result.externalSuggestions, [])
  assert.equal(result.preferExternal, false)
  assert.match(
    String(invokeModel.mock.calls[0].arguments[0]),
    /库里找模式禁止生成 externalSuggestions/,
  )
})

test('web mode keeps external candidates above the minimum below the preference threshold', async () => {
  const result = await judgeToolRecommendations('task', [match], 'web')

  assert.equal(result.externalSuggestions[0]?.externalConfidence, 0.75)
  assert.equal(result.externalSuggestions[0]?.score, 75)
  assert.equal(result.preferExternal, false)
})
