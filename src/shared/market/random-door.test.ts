import test from 'node:test'
import assert from 'node:assert/strict'
import type { ToolItem } from '@/shared/market/tool-registry'
import {
  buildRandomDoorAnalysisPayload,
  buildRandomDoorReason,
  isRandomDoorEligible,
  pickRandomDoorRecommendation,
} from '@/shared/market/random-door'

function makeTool(overrides: Partial<ToolItem> = {}): ToolItem {
  return {
    id: 'tool-1',
    name: 'Door Tool',
    icon: 'door',
    iconType: 'emoji',
    iconText: 'D',
    iconImageUrl: null,
    url: 'https://example.com',
    description: 'A useful tool',
    category: 'developer',
    tags: ['code', 'ship'],
    source: 'market',
    status: 'active',
    executionMode: 'external_link',
    pricingModel: 'freemium',
    requiresAuth: false,
    platform: 'web',
    capabilities: ['test'],
    recommendedFor: ['dev'],
    trustSignals: { curated: true, official: false, communityVerified: false },
    ratingSummary: { upvotes: 1, downvotes: 0, score: 1 },
    usageStats: { saves: 1, opens: 1, subscriptions: 0 },
    subscriptionSupport: false,
    ...overrides,
  }
}

test('isRandomDoorEligible excludes unusable tools', () => {
  assert.equal(isRandomDoorEligible(makeTool()), true)
  assert.equal(isRandomDoorEligible(makeTool({ url: null })), false)
  assert.equal(isRandomDoorEligible(makeTool({ executionMode: 'reference_only' })), false)
  assert.equal(isRandomDoorEligible(makeTool({ status: 'blocked' })), false)
})

test('pickRandomDoorRecommendation selects from eligible tools only', () => {
  const tools = [
    makeTool({ id: 'first', name: 'First', tags: ['alpha'] }),
    makeTool({ id: 'skip-no-url', url: null }),
    makeTool({ id: 'second', name: 'Second', category: 'design', tags: [] }),
  ]

  const recommendation = pickRandomDoorRecommendation(tools, () => 0.9)

  assert.ok(recommendation)
  assert.equal(recommendation?.tool.id, 'second')
  assert.equal(recommendation?.poolSize, 2)
})

test('buildRandomDoorReason returns a short explanation', () => {
  const reason = buildRandomDoorReason(makeTool({ name: 'Alpha', category: 'search', tags: [] }))
  assert.equal(typeof reason, 'string')
  assert.ok(reason.length > 0)
})

test('buildRandomDoorAnalysisPayload creates a Step 3 recommendation payload', () => {
  const tool = makeTool({ id: 'door-tool', name: 'Door Tool', tags: ['code', 'ship'] })
  const payload = buildRandomDoorAnalysisPayload({
    tool,
    reason: 'Good random starting point.',
    poolSize: 12,
  })

  assert.equal(payload.selectedToolPayload.toolId, 'door-tool')
  assert.equal(payload.uiPayload.candidates[0]?.toolId, 'door-tool')
  assert.equal(payload.uiPayload.candidates[0]?.reason, 'Good random starting point.')
  assert.equal(payload.uiPayload.taskFrame.goal, '任意门随机推荐')
  assert.ok(payload.uiPayload.selectionReason.length > 0)
  assert.ok(payload.uiPayload.selectionSignals.length > 0)
  assert.ok(payload.uiPayload.recommendedActions.length > 0)
})
