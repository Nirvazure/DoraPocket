import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildProfileMemorySummary,
  filterProfileHistory,
  resolveTaskDirection,
  type RecommendationHistoryItem,
} from '@/shared/user/profile-memory'

function historyItem(
  input: Partial<RecommendationHistoryItem> & {
    id: string
    userText: string
  },
): RecommendationHistoryItem {
  return {
    id: input.id,
    createdAt: input.createdAt ?? Date.now(),
    userText: input.userText,
    finalText: input.finalText ?? '先试一个合适的工具。',
    selectedToolId: input.selectedToolId ?? null,
    taskFrame: input.taskFrame ?? {
      goal: input.userText,
      mode: 'discover',
      missingInputs: [],
      scenario: input.userText,
      constraints: [],
      confidenceDrivers: [],
      urgency: 'unspecified',
    },
    candidates: input.candidates ?? [],
    selectionReason: input.selectionReason ?? '匹配当前任务。',
    preferenceSignals: input.preferenceSignals ?? [],
    selectionSignals: input.selectionSignals ?? [],
    starterPath: input.starterPath ?? null,
    clarifyTurnCount: input.clarifyTurnCount ?? 0,
    confidenceLevel: input.confidenceLevel ?? 'normal',
    openedToolId: input.openedToolId ?? null,
    savedToolId: input.savedToolId ?? null,
    evaluatedAt: input.evaluatedAt ?? null,
  }
}

test('resolveTaskDirection classifies research tasks from goal and user text', () => {
  const item = historyItem({
    id: 'research',
    userText: '帮我查资料，要可靠引用和来源',
  })

  assert.equal(resolveTaskDirection(item).id, 'research')
})

test('resolveTaskDirection classifies design tasks from candidate reason', () => {
  const item = historyItem({
    id: 'design',
    userText: '我要做一张活动图',
    candidates: [
      {
        title: 'Design Tool',
        candidateType: 'external_suggestion',
        score: 88,
        sourceLabel: 'external',
        reason: '适合生成海报、视觉素材和产品图。',
      },
    ],
  })

  assert.equal(resolveTaskDirection(item).id, 'design_assets')
})

test('buildProfileMemorySummary counts directions and preference signals', () => {
  const summary = buildProfileMemorySummary([
    historyItem({
      id: 'a',
      userText: '找一个免费的 PDF 压缩工具，最好免注册',
      taskFrame: {
        goal: '找一个免费的 PDF 压缩工具，最好免注册',
        mode: 'discover',
        missingInputs: [],
        scenario: '找一个免费的 PDF 压缩工具，最好免注册',
        constraints: ['免费优先', '免注册优先'],
        budgetPreference: 'free_first',
        authPreference: 'no_signup',
        confidenceDrivers: [],
        urgency: 'fast_start',
      },
      savedToolId: 'pdf-tool',
      evaluatedAt: 1,
    }),
    historyItem({
      id: 'b',
      userText: '整理会议纪要并输出结构',
    }),
  ])

  assert.equal(summary.totalCount, 2)
  assert.equal(summary.savedCount, 1)
  assert.equal(summary.evaluatedCount, 1)
  assert.equal(summary.directionStats[0]?.id, 'office_tools')
  assert.ok(summary.preferenceSignals.includes('免费优先'))
  assert.ok(summary.preferenceSignals.includes('免注册优先'))
})

test('filterProfileHistory filters by direction and status', () => {
  const items = [
    historyItem({ id: 'a', userText: '找一个免费的 PDF 压缩工具', savedToolId: 'pdf-tool' }),
    historyItem({ id: 'b', userText: '帮我查资料，要可靠引用', evaluatedAt: 1 }),
    historyItem({ id: 'c', userText: '推荐一个 AI 工具', confidenceLevel: 'low' }),
  ]

  assert.deepEqual(
    filterProfileHistory(items, { directionId: 'research', status: 'all' }).map((item) => item.id),
    ['b'],
  )
  assert.deepEqual(
    filterProfileHistory(items, { directionId: 'all', status: 'saved' }).map((item) => item.id),
    ['a'],
  )
  assert.deepEqual(
    filterProfileHistory(items, { directionId: 'all', status: 'low_confidence' }).map(
      (item) => item.id,
    ),
    ['c'],
  )
})
