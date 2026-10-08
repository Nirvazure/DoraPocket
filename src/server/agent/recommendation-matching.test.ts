import assert from 'node:assert/strict'
import { beforeEach, mock, test } from 'node:test'
import type { ToolMatch } from '@/shared/market/tool-registry'
import { createEmptyMarketContext } from '@/shared/market/market-defaults'

const matches: ToolMatch[] = ['Tauri', 'Sniffnet', 'Search'].map((name) => ({
  tool: {
    id: name,
    name,
    icon: 'tool',
    url: `https://${name.toLowerCase()}.example.com`,
    description: 'Developer framework, network monitor, or search. No cloud file storage.',
    category: 'developer',
    tags: ['cloud'],
    source: 'market',
    status: 'active',
    executionMode: 'external_link',
    pricingModel: 'free',
    requiresAuth: false,
    platform: 'web',
    capabilities: [],
    recommendedFor: [],
    trustSignals: { curated: false, official: false, communityVerified: false },
    ratingSummary: { upvotes: 1000, downvotes: 0, score: 1000 },
    usageStats: { saves: 1000, opens: 1000, subscriptions: 1000 },
    subscriptionSupport: false,
  },
  score: 10000,
  reason: 'High retrieval score',
  sourceLabel: 'market',
}))

const recall = mock.fn(async () => ({ matches, recallSummary: null }))
const invokeModel =
  mock.fn<(input: string, systemPrompt: string, temperature: number) => Promise<string>>()
mock.module(new URL('../retrieval/tool-recall.ts', import.meta.url).href, {
  namedExports: { recallToolMatchesFromCatalog: recall },
})
mock.module(new URL('./model.ts', import.meta.url).href, {
  namedExports: { DORA_PROMPT: 'Test system prompt', invokeModel },
})

const { buildRankedCandidates } = await import('./ui-payload')
const { streamPocketGraph } = await import('./graph')
const preferences = { recommendationLimit: 3, minMatchScore: 90 } as const

function assessment(
  toolId: string,
  matchScore: number,
  coreTaskSatisfied = true,
  requiredConstraintsSatisfied = true,
) {
  return {
    toolId,
    matchScore,
    coreTaskSatisfied,
    requiredConstraintsSatisfied,
    reason: coreTaskSatisfied
      ? 'Supports the requested task'
      : 'Does not provide cloud file storage',
  }
}

beforeEach(() => {
  recall.mock.resetCalls()
  recall.mock.mockImplementation(async () => ({ matches, recallSummary: null }))
  invokeModel.mock.resetCalls()
  invokeModel.mock.mockImplementation(async () =>
    JSON.stringify({
      ranking: matches.map((match) => assessment(match.tool.id, 100, false)),
      externalSuggestions: [],
    }),
  )
})

test('cloud request with three unrelated high-retrieval tools produces no recommendation or explanation', async () => {
  const events = await Array.fromAsync(
    streamPocketGraph(
      '找一个云盘工具',
      createEmptyMarketContext(),
      'standard',
      undefined,
      'market',
      preferences,
    ),
  )
  const done = events.at(-1)
  assert.ok(done?.type === 'done')
  assert.deepEqual(done.ui_payload.candidates, [])
  assert.equal(done.selected_tool, null)
  assert.equal(done.text, '当前库中未找到达到 90% 匹配度的工具。')
  assert.equal(done.ui_payload.evaluationPrompt, undefined)
  assert.equal(invokeModel.mock.callCount(), 1)
})

test('only the two absolute scores meeting 90 survive without being promoted to 100', async () => {
  invokeModel.mock.mockImplementation(async () =>
    JSON.stringify({
      ranking: [assessment('Tauri', 94), assessment('Sniffnet', 90), assessment('Search', 89)],
      externalSuggestions: [],
    }),
  )
  const result = await buildRankedCandidates(
    'cloud storage',
    createEmptyMarketContext(),
    undefined,
    'market',
    preferences,
  )
  assert.deepEqual(
    result.candidates.map((item) => [item.title, item.score]),
    [
      ['Tauri', 94],
      ['Sniffnet', 90],
    ],
  )
})

test('unknown IDs and omitted evaluations cannot restore raw retrieval scores', async () => {
  invokeModel.mock.mockImplementation(async () =>
    JSON.stringify({
      ranking: [assessment('unknown', 100), assessment('Sniffnet', 92)],
      externalSuggestions: [],
    }),
  )
  const result = await buildRankedCandidates(
    'cloud storage',
    createEmptyMarketContext(),
    undefined,
    'market',
    preferences,
  )
  assert.deepEqual(
    result.candidates.map((item) => item.title),
    ['Sniffnet'],
  )
})

test('an unmet mandatory condition cannot be rescued by a high score', async () => {
  invokeModel.mock.mockImplementation(async () =>
    JSON.stringify({
      ranking: matches.map((match) => assessment(match.tool.id, 100, true, false)),
      externalSuggestions: [],
    }),
  )
  const result = await buildRankedCandidates(
    '必须免费且有中文界面的云盘',
    createEmptyMarketContext(),
    undefined,
    'market',
    preferences,
  )
  assert.deepEqual(result.candidates, [])
})

test('model outage cannot fall back to unassessed retrieval candidates', async () => {
  invokeModel.mock.mockImplementation(async () => {
    throw new Error('model unavailable')
  })
  await assert.rejects(
    buildRankedCandidates(
      'cloud storage',
      createEmptyMarketContext(),
      undefined,
      'market',
      preferences,
    ),
    /无法完成工具适配评估/,
  )
})

test('catalog outage is reported instead of being interpreted as an empty library', async () => {
  recall.mock.mockImplementation(async () => {
    throw new Error('database unavailable')
  })
  await assert.rejects(
    buildRankedCandidates(
      'cloud storage',
      createEmptyMarketContext(),
      undefined,
      'market',
      preferences,
    ),
    /无法读取工具库/,
  )
  assert.equal(invokeModel.mock.callCount(), 0)
})

test('an empty library returns no candidates without requiring the model', async () => {
  recall.mock.mockImplementation(async () => ({ matches: [], recallSummary: null }))
  const result = await buildRankedCandidates(
    'cloud storage',
    createEmptyMarketContext(),
    undefined,
    'market',
    preferences,
  )
  assert.deepEqual(result.candidates, [])
  assert.equal(invokeModel.mock.callCount(), 0)
})

test('user submissions are assessed from their actual description in the same model call', async () => {
  const context = createEmptyMarketContext()
  context.submissions = [
    {
      id: 'drive',
      name: 'Drive',
      url: 'https://drive.example.com',
      description: 'Cloud file storage with a free plan',
      tags: ['cloud'],
      submittedAt: 0,
      status: 'review',
    },
  ]
  invokeModel.mock.mockImplementation(async () =>
    JSON.stringify({
      ranking: [
        ...matches.map((match) => assessment(match.tool.id, 0, false)),
        assessment('drive', 92),
      ],
      externalSuggestions: [],
    }),
  )
  const result = await buildRankedCandidates(
    'cloud storage, free first',
    context,
    undefined,
    'market',
    preferences,
  )
  assert.deepEqual(
    result.candidates.map((item) => [item.candidateType, item.score]),
    [['submission', 92]],
  )
  assert.match(invokeModel.mock.calls[0].arguments[0], /Cloud file storage with a free plan/)
  assert.equal(invokeModel.mock.callCount(), 1)
})

test('clarification retains the original cloud task and mandatory conditions at the selected threshold', async () => {
  const events = await Array.fromAsync(
    streamPocketGraph(
      '免费优先',
      createEmptyMarketContext(),
      'standard',
      {
        sessionTurn: 2,
        anchorPrompt: '找一个云盘工具，必须有中文界面',
        priorMessages: [{ role: 'assistant', content: '预算有什么偏好？' }],
      },
      'market',
      preferences,
    ),
  )
  const prompt = invokeModel.mock.calls[0].arguments[0]
  assert.match(prompt, /找一个云盘工具，必须有中文界面/)
  assert.match(prompt, /用户最新补充：免费优先/)
  const done = events.at(-1)
  assert.ok(done?.type === 'done')
  assert.equal(done.text, '当前库中未找到达到 90% 匹配度的工具。')
})

test('mixed mode applies the same 90 point threshold to external candidates without bonus scores', async () => {
  invokeModel.mock.mockImplementation(async () =>
    JSON.stringify({
      ranking: matches.map((match) => assessment(match.tool.id, 0, false)),
      externalSuggestions: [
        {
          ...assessment('external', 89),
          title: 'Below threshold',
          url: 'https://below.example.com',
          externalConfidence: 0.99,
        },
        {
          ...assessment('external', 92),
          title: 'Qualified drive',
          url: 'https://qualified.example.com',
          externalConfidence: 0.9,
        },
      ],
      preferExternal: true,
    }),
  )
  const result = await buildRankedCandidates(
    'cloud storage',
    createEmptyMarketContext(),
    undefined,
    'web',
    preferences,
  )
  assert.deepEqual(
    result.candidates.map((item) => [item.title, item.score]),
    [['Qualified drive', 92]],
  )
})

test('market mode remains empty even if the model tries to introduce external recommendations', async () => {
  invokeModel.mock.mockImplementation(async () =>
    JSON.stringify({
      ranking: matches.map((match) => assessment(match.tool.id, 0, false)),
      externalSuggestions: [
        {
          ...assessment('external', 100),
          title: 'External drive',
          url: 'https://drive.example.com',
          externalConfidence: 1,
        },
      ],
    }),
  )
  const result = await buildRankedCandidates(
    'cloud storage',
    createEmptyMarketContext(),
    undefined,
    'market',
    preferences,
  )
  assert.deepEqual(result.candidates, [])
})

test('free-first remains a preference instead of a mandatory free-only condition', async () => {
  recall.mock.mockImplementation(async () => ({
    matches: [
      {
        ...matches[0],
        tool: {
          ...matches[0].tool,
          description: 'Cloud file storage with a paid plan',
          pricingModel: 'paid',
        },
      },
    ],
    recallSummary: null,
  }))
  invokeModel.mock.mockImplementation(async () =>
    JSON.stringify({ ranking: [assessment('Tauri', 91)], externalSuggestions: [] }),
  )
  const result = await buildRankedCandidates(
    'cloud storage, free first',
    createEmptyMarketContext(),
    undefined,
    'market',
    preferences,
  )
  assert.equal(result.candidates.length, 1)
  assert.match(
    invokeModel.mock.calls[0].arguments[0],
    /免费优先、中文优先等软偏好影响评分，但不直接否决/,
  )
})
