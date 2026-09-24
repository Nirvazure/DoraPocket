import assert from 'node:assert/strict'
import { beforeEach, mock, test } from 'node:test'
import type { AgentCandidate, MarketContext } from '@/shared/market/market-types'
import type { ToolItem } from '@/shared/market/tool-registry'
import * as payloadHelpers from '@/server/agent/ui-payload'
import type { PocketStreamEvent } from '@/server/agent/graph'

const marketContext: MarketContext = {
  savedItems: [],
  subscriptions: [],
  feedback: [],
  submissions: [],
  preferenceProfile: {
    preferredCategories: [],
    preferredTags: [],
    preferredPlatforms: [],
    preferredPricing: [],
    preferredExecutionModes: [],
    avoidAuthWall: false,
    prefersSubscriptionTools: false,
    summary: [],
  },
}
const tool: ToolItem = {
  id: 'fixture',
  name: 'Fixture Tool',
  icon: 'tool',
  iconType: 'emoji',
  iconText: 'T',
  iconImageUrl: null,
  url: 'https://example.com',
  description: 'Test tool',
  category: 'developer',
  tags: [],
  source: 'market',
  status: 'active',
  executionMode: 'external_link',
  pricingModel: 'free',
  requiresAuth: false,
  platform: 'web',
  capabilities: [],
  recommendedFor: [],
  trustSignals: { curated: false, official: false, communityVerified: false },
  ratingSummary: { upvotes: 0, downvotes: 0, score: 0 },
  usageStats: { saves: 0, opens: 0, subscriptions: 0 },
  subscriptionSupport: false,
  defaultArgs: { query: 'fixture' },
}
const candidate = {
  toolId: tool.id,
  title: tool.name,
  url: tool.url,
  candidateType: 'tool' as const,
  score: 90,
  sourceLabel: 'market' as const,
  reason: '固定候选理由',
}
const rankResult = {
  matches: [],
  candidates: [candidate],
  topTool: tool,
  primaryCandidate: candidate,
  selectionReason: '固定排序理由',
  recallSummary: null,
}
type RankedResult = Omit<
  Awaited<ReturnType<typeof payloadHelpers.buildRankedCandidates>>,
  'primaryCandidate'
> & { primaryCandidate: AgentCandidate | null }
const rank = mock.fn<
  (...args: Parameters<typeof payloadHelpers.buildRankedCandidates>) => Promise<RankedResult>
>(async () => rankResult)
const reply = '这是固定模型回答，用于核对分块边界以及完整的推荐输出。下一步打开工具试用。'
const invokeModel = mock.fn<
  (input: string, systemPrompt: string, temperature: number) => Promise<string>
>(async () => reply)
mock.module(new URL('./ui-payload.ts', import.meta.url).href, {
  namedExports: { ...payloadHelpers, buildRankedCandidates: rank },
})
mock.module(new URL('./model.ts', import.meta.url).href, {
  namedExports: { DORA_PROMPT: '固定系统提示词', invokeModel },
})
const { streamPocketGraph } = await import('@/server/agent/graph')

beforeEach(() => {
  rank.mock.resetCalls()
  rank.mock.mockImplementation(async () => rankResult)
  invokeModel.mock.resetCalls()
  invokeModel.mock.mockImplementation(async () => reply)
})

async function collect(...args: Parameters<typeof streamPocketGraph>) {
  return Array.fromAsync(streamPocketGraph(...args))
}

function sequence(events: PocketStreamEvent[]) {
  return events.map((event) => (event.type === 'progress' ? event.stage : event.type))
}

test('direct recommendation preserves progress, selected tool, chunks, and complete prompt', async () => {
  const events = await collect('压缩 PDF', marketContext)
  assert.deepEqual(sequence(events), [
    'understanding',
    'constraining',
    'recalling',
    'ranking',
    'meta',
    'ready',
    'delta',
    'delta',
    'done',
  ])
  assert.deepEqual(
    events.filter((event) => event.type === 'delta').map((event) => event.text),
    [reply.slice(0, 24), reply.slice(24)],
  )
  const done = events.at(-1)
  assert.ok(done?.type === 'done')
  assert.equal(done.clarificationStatus, 'ready')
  assert.equal(done.ui_payload.confidenceLevel, 'normal')
  assert.deepEqual(done.selected_tool, { toolId: tool.id, args: tool.defaultArgs })
  assert.deepEqual(invokeModel.mock.calls[0].arguments, [
    [
      '用户问题：压缩 PDF',
      '任务模式：discover',
      '推荐范围：库里找',
      '缺失参数：无',
      '推荐理由：固定排序理由',
      '决策摘要：这次先试 Fixture Tool。',
      '首推依据：固定候选理由、固定排序理由',
      '风险边界：无',
      '社区证据：无',
      '个人证据：无',
      '用户偏好画像：无',
      '候选工具：\n1. Fixture Tool｜来源：market｜理由：固定候选理由',
      '用户提交的市场条目：\n无',
      '解释风格：保持 DoraPocket 默认表达，先结论、再理由、再动作；解释适中，不要过度扩写。',
      '请输出：一句结论 + 最值得先用的工具 + 简短理由 + 代价或边界 + 下一步动作。不要堆列表，不要暴露内部 ID。',
      '如果首选是 Hub 外建议，必须明确说它当前不在 Tool Hub，不能说成已收录、可评价、可自动沉淀；下一步只能建议先打开试用，确认有效后再手动提交到 Tool Hub。',
      '如果出现 Hub 外建议，提醒用户 URL、价格和当前可用性需要自行核验。',
    ].join('\n'),
    '固定系统提示词',
    0.35,
  ])
})

test('graph carries web recommendation mode through ranking and UI payload', async () => {
  const events = await collect('压缩 PDF', marketContext, 'standard', undefined, 'web')
  const done = events.at(-1)
  assert.ok(done?.type === 'done')
  assert.equal(rank.mock.calls[0].arguments[3], 'web')
  assert.equal(done.ui_payload.recommendationMode, 'web')
})

test('graph normalizes an invalid recommendation mode to market', async () => {
  const events = await collect('压缩 PDF', marketContext, 'standard', undefined, 'invalid' as never)
  const done = events.at(-1)
  assert.ok(done?.type === 'done')
  assert.equal(rank.mock.calls[0].arguments[3], 'market')
  assert.equal(done.ui_payload.recommendationMode, 'market')
})

test('clarification emits its question and metadata without generating a response', async () => {
  const events = await collect('帮我推荐一个 AI 工具', marketContext)
  assert.deepEqual(sequence(events), [
    'understanding',
    'constraining',
    'recalling',
    'ranking',
    'clarifying',
    'clarify',
    'meta',
    'done',
  ])
  const clarify = events.find((event) => event.type === 'clarify')
  assert.ok(clarify?.type === 'clarify')
  assert.equal(clarify.question, '这次具体想完成什么任务或产出？')
  assert.deepEqual(clarify.missingInputs, ['使用场景', '预算偏好', '注册偏好'])
  assert.equal(invokeModel.mock.callCount(), 0)
  const done = events.at(-1)
  assert.ok(done?.type === 'done')
  assert.equal(done.text, clarify.question)
})

for (const [name, sessionTurn, skipClarify, mode, status] of [
  ['skip clarification', 1, true, 'standard', 'ready'],
  ['exhaust standard turns', 3, false, 'standard', 'exhausted'],
  ['exhaust brief turns', 2, false, 'brief', 'exhausted'],
] as const) {
  test(`${name} generates a low-confidence recommendation`, async () => {
    const events = await collect('帮我推荐一个 AI 工具', marketContext, mode, {
      sessionTurn,
      skipClarify,
      anchorPrompt: '原始任务',
      priorMessages: [{ role: 'assistant', content: '上一轮问题' }],
    })
    const done = events.at(-1)
    assert.ok(done?.type === 'done')
    assert.equal(done.clarificationStatus, status)
    assert.equal(done.ui_payload.confidenceLevel, 'low')
    assert.equal(
      events.some((event) => event.type === 'clarify'),
      false,
    )
    assert.equal(rank.mock.calls[0].arguments[0], '帮我推荐一个 AI 工具')
    if (mode === 'brief')
      assert.match(invokeModel.mock.calls[0].arguments[0], /解释风格：更短、更直接/)
  })
}

test('model rejection preserves the candidate fallback and done event', async () => {
  invokeModel.mock.mockImplementation(async () => {
    throw new Error('model unavailable')
  })
  const events = await collect('压缩 PDF', marketContext)
  const done = events.at(-1)
  assert.ok(done?.type === 'done')
  assert.equal(
    done.text,
    '我先把候选收束到「Fixture Tool」。固定排序理由 你可以先按这个方向试一次，再根据结果继续校准。',
  )
  assert.equal(done.clarificationStatus, 'ready')
})

test('model rejection without candidates preserves the environment fallback', async () => {
  rank.mock.mockImplementation(async () => ({
    ...rankResult,
    candidates: [],
    topTool: null,
    primaryCandidate: null,
  }))
  invokeModel.mock.mockImplementation(async () => {
    throw new Error('model unavailable')
  })
  const events = await collect('压缩 PDF', marketContext)
  const done = events.at(-1)
  assert.ok(done?.type === 'done')
  assert.equal(
    done.text,
    '这次已经完成任务理解，但当前本地环境缺少可用的模型或工具库配置，暂时无法生成稳定推荐。你可以补充工具库或模型配置后再试。',
  )
  assert.equal(done.selected_tool, null)
})

test('external suggestions remain unselected and preserve the prompt boundary', async () => {
  const external = {
    ...candidate,
    candidateType: 'external_suggestion' as const,
    externalBoundary: '当前不在 Tool Hub',
  }
  rank.mock.mockImplementation(async () => ({
    ...rankResult,
    candidates: [external],
    topTool: null,
    primaryCandidate: external,
  }))
  const events = await collect('压缩 PDF', marketContext)
  const done = events.at(-1)
  assert.ok(done?.type === 'done')
  assert.equal(done.selected_tool, null)
  assert.deepEqual(done.ui_payload.candidates, [external])
  assert.match(invokeModel.mock.calls[0].arguments[0], /边界：当前不在 Tool Hub/)
})

test('classification rejection propagates after understanding, with no misleading done', async () => {
  rank.mock.mockImplementation(async () => {
    throw new Error('ranking unavailable')
  })
  const stream = streamPocketGraph('压缩 PDF', marketContext)
  assert.deepEqual((await stream.next()).value, { type: 'progress', stage: 'understanding' })
  await assert.rejects(stream.next(), /ranking unavailable/)
  assert.equal(invokeModel.mock.callCount(), 0)
})
