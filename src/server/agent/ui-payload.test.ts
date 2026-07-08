import assert from 'node:assert/strict'
import test from 'node:test'

import { buildAgentUiPayload } from '@/server/agent/ui-payload'
import type { AgentCandidate, AgentTaskFrame, MarketContext } from '@/shared/market/market-types'
import type { ToolItem } from '@/shared/market/tool-registry'

const taskFrame: AgentTaskFrame = {
  goal: '压缩 PDF',
  mode: 'discover',
  missingInputs: [],
  role: '开发',
  scenario: '压缩 PDF',
  constraints: ['免费优先', '免注册优先'],
  budgetPreference: 'free_first',
  authPreference: 'no_signup',
  languagePreference: null,
  evidenceRequirement: null,
  platformPreference: 'web',
  urgency: 'fast_start',
  confidenceDrivers: [],
}

const tool: ToolItem = {
  id: 'pdf-tool',
  name: 'PDF Tool',
  icon: 'pdf',
  url: 'https://example.com',
  description: 'Compress PDFs online.',
  category: 'productivity',
  tags: ['pdf', 'compress'],
  source: 'market',
  status: 'active',
  executionMode: 'external_link',
  pricingModel: 'free',
  requiresAuth: false,
  platform: 'web',
  capabilities: ['compress_pdf'],
  recommendedFor: ['office'],
  trustSignals: { curated: true, official: true, communityVerified: true },
  ratingSummary: { upvotes: 0, downvotes: 0, score: 0 },
  usageStats: { saves: 0, opens: 0, subscriptions: 0 },
  subscriptionSupport: false,
}

const candidates: AgentCandidate[] = [
  {
    toolId: 'pdf-tool',
    title: 'PDF Tool',
    url: 'https://example.com',
    candidateType: 'tool',
    score: 92,
    sourceLabel: 'market',
    reason: '免费且免注册，适合快速压缩 PDF。',
  },
  {
    toolId: 'heavy-tool',
    title: 'Heavy Tool',
    candidateType: 'tool',
    score: 78,
    sourceLabel: 'market',
    reason: '功能更完整，但注册和学习成本更高。',
  },
]

const marketContext: MarketContext = {
  savedItems: [{ toolId: 'pdf-tool' }],
  subscriptions: [],
  feedback: [
    {
      toolId: 'pdf-tool',
      vote: 'up',
      starRating: 5,
      selectedTags: ['fast_to_start', 'no_login'],
      updatedAt: Date.now(),
    },
  ],
  submissions: [],
  preferenceProfile: {
    preferredCategories: ['productivity'],
    preferredTags: ['pdf'],
    preferredPlatforms: ['web'],
    preferredPricing: ['free'],
    preferredExecutionModes: ['external_link'],
    avoidAuthWall: true,
    prefersSubscriptionTools: false,
    summary: ['你经常保存 PDF 类工具'],
  },
}

test('buildAgentUiPayload creates decision evidence for the primary recommendation', () => {
  const payload = buildAgentUiPayload(
    taskFrame,
    tool,
    candidates,
    'PDF Tool 这次启动成本最低。',
    marketContext,
    candidates[0],
  )

  assert.equal(payload.decisionSummary, '这次先试 PDF Tool。')
  const firstReason = payload.whyThisFirst?.[0]
  assert.equal(firstReason, candidates[0].reason)
  assert.equal(payload.whyNotAlternatives?.['heavy-tool'], '功能更完整，但注册和学习成本更高。')
  assert.ok(payload.trustEvidence?.includes('官方来源'))
  assert.ok((payload.communityEvidence?.length ?? 0) > 0)
  assert.ok(payload.communityEvidence?.some((line) => line.includes('5.0')))
  assert.ok((payload.personalEvidence?.length ?? 0) > 0)
  assert.equal(payload.evaluationPrompt, '试完后告诉我这次推荐准不准，我会用它校准下一次。')
})

test('buildAgentUiPayload surfaces risk notes for auth and paid tools', () => {
  const paidTool = { ...tool, requiresAuth: true, pricingModel: 'paid' as const }
  const payload = buildAgentUiPayload(
    taskFrame,
    paidTool,
    candidates,
    'PDF Tool 功能合适，但存在门槛。',
    marketContext,
    candidates[0],
  )

  assert.ok(payload.riskNotes?.includes('需要注册或登录，可能不符合免注册优先。'))
  assert.ok(payload.riskNotes?.includes('不是免费优先方案，试用前需要确认价格。'))
})
