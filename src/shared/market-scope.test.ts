import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildActivePocketToolIds,
  resolveCurrentTools,
  resolveMarketSection,
  resolveScopedTools,
  type MarketToolCardItem,
} from '@/shared/market-scope'

const baseTool = (
  id: string,
  category: MarketToolCardItem['category'],
  source: MarketToolCardItem['source'] = 'market',
): MarketToolCardItem => ({
  id,
  name: id,
  icon: '🔧',
  url: 'https://example.com',
  description: `${id} desc`,
  category,
  tags: [],
  source,
  status: 'active',
  executionMode: 'external_link',
  pricingModel: 'free',
  requiresAuth: false,
  platform: 'web',
  capabilities: [],
  recommendedFor: [],
  trustSignals: {
    curated: false,
    official: false,
    communityVerified: false,
  },
  ratingSummary: {
    upvotes: 0,
    downvotes: 0,
    score: 0,
  },
  usageStats: {
    saves: 0,
    opens: 0,
    subscriptions: 0,
  },
  subscriptionSupport: false,
  reviewAggregate: null,
})

test('buildActivePocketToolIds excludes archived items', () => {
  const ids = buildActivePocketToolIds([
    {
      toolId: 'a',
      savedAt: 1,
      lastUsedAt: 1,
      useCount: 0,
      pinned: false,
      purchased: false,
      archived: false,
    },
    {
      toolId: 'b',
      savedAt: 1,
      lastUsedAt: 1,
      useCount: 0,
      pinned: false,
      purchased: false,
      archived: true,
    },
  ])
  assert.deepEqual([...ids], ['a'])
})

test('pocket scope filters to saved tool ids only', () => {
  const tools = [baseTool('a', 'ai_assistant'), baseTool('b', 'developer')]
  const pocketToolIds = new Set(['a'])
  const scoped = resolveScopedTools({ scope: 'pocket', tools, pocketToolIds })
  assert.equal(scoped.length, 1)
  assert.equal(scoped[0]?.id, 'a')
})

test('category section filters scoped tools in both discover and pocket scope', () => {
  const tools = [baseTool('a', 'ai_assistant'), baseTool('b', 'developer')]
  const pocketToolIds = new Set(['a', 'b'])
  const scoped = resolveScopedTools({ scope: 'pocket', tools, pocketToolIds })

  assert.equal(
    resolveCurrentTools({ selectedSection: 'ai_assistant', scopedTools: scoped }).length,
    1,
  )
  assert.equal(resolveCurrentTools({ selectedSection: 'developer', scopedTools: scoped }).length, 1)
})

test('resolveMarketSection falls back to first category when selected section invalid', () => {
  const entries = [['ai_assistant', 'AI 助手']] as const
  assert.equal(
    resolveMarketSection({
      selectedSection: 'developer',
      categoryEntries: entries,
    }),
    'ai_assistant',
  )
})

test('resolveMarketSection falls back when pocket section is selected', () => {
  const entries = [['ai_assistant', 'AI 助手']] as const
  assert.equal(
    resolveMarketSection({
      selectedSection: 'pocket',
      categoryEntries: entries,
    }),
    'ai_assistant',
  )
})
