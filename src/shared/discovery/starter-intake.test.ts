import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canStartStarterAnalysis,
  canStartStructuredAnalysis,
  composeStarterPrompt,
  createEmptyStarterIntake,
  extractColdStartTaskLine,
  inferStarterIntakeFromText,
  normalizeStarterIntakeDraft,
  parseStarterIntakeDraftJson,
  resolveStarterDisplayGoal,
} from '@/shared/discovery/starter-intake'

test('canStartStructuredAnalysis requires outcome or custom task length', () => {
  assert.equal(canStartStructuredAnalysis(createEmptyStarterIntake()), false)

  assert.equal(
    canStartStructuredAnalysis({
      ...createEmptyStarterIntake(),
      outcomeId: 'office_tools',
      customTask: '',
    }),
    true,
  )

  assert.equal(
    canStartStructuredAnalysis({
      ...createEmptyStarterIntake(),
      customTask: '压缩 PDF',
    }),
    true,
  )
})

test('canStartStarterAnalysis treats role as optional and outcome or task as required', () => {
  const empty = createEmptyStarterIntake()

  const ready = {
    ...empty,
    outcomeId: 'writing' as const,
    customTask: '',
  }
  assert.equal(canStartStarterAnalysis(ready), true)

  assert.equal(
    canStartStarterAnalysis({
      ...empty,
      customTask: '压缩 PDF',
    }),
    true,
  )
})

test('composeStarterPrompt and display goal separate task line', () => {
  const intake = {
    roleId: 'marketer' as const,
    constraintIds: ['free_first' as const],
    outcomeId: 'office_tools' as const,
    customTask: '',
  }
  const prompt = composeStarterPrompt(intake)
  const display = resolveStarterDisplayGoal(intake)

  assert.match(prompt, /^【冷启动】/)
  assert.match(prompt, /身份：市场 \/ 运营/)
  assert.match(prompt, /任务：/)
  assert.equal(display, '我有一个办公效率小任务，请给出这次最值得先试的工具。')
  assert.equal(extractColdStartTaskLine(prompt), display)
})

test('inferStarterIntakeFromText creates an editable draft from natural language', () => {
  const draft = inferStarterIntakeFromText(
    '我是运营，想找一个免费、中文友好的工具，把竞品资料整理成带来源的表格。',
  )

  assert.equal(draft.roleId, 'marketer')
  assert.equal(draft.outcomeId, 'research_citations')
  assert.equal(draft.customTask, draft.sourceText)
  assert.deepEqual(draft.constraintIds, ['free_first', 'citations', 'chinese'])
})

test('inferStarterIntakeFromText keeps uncertain fields editable instead of overfilling them', () => {
  const draft = inferStarterIntakeFromText('帮我想想这件事怎么做')

  assert.equal(draft.roleId, null)
  assert.equal(draft.outcomeId, null)
  assert.equal(draft.customTask, '帮我想想这件事怎么做')
  assert.deepEqual(draft.constraintIds, [])
})

test('parseStarterIntakeDraftJson normalizes model JSON into safe ids', () => {
  const draft = parseStarterIntakeDraftJson(
    JSON.stringify({
      roleId: 'marketer',
      outcomeId: 'research_citations',
      customTask: '整理竞品资料',
      constraintIds: ['free_first', 'citations', 'unknown'],
      sourceText: '我是运营，整理竞品资料',
      missingInputs: ['预算', '导出格式', '多余问题', '第四个'],
      confidence: { role: 0.8, goal: 1.2, constraints: -1 },
      reasoningSummary: '识别到运营和来源要求',
    }),
    '原始输入',
  )

  assert.equal(draft.roleId, 'marketer')
  assert.equal(draft.outcomeId, 'research_citations')
  assert.deepEqual(draft.constraintIds, ['free_first', 'citations'])
  assert.deepEqual(draft.missingInputs, ['预算', '导出格式', '多余问题'])
  assert.deepEqual(draft.confidence, { role: 0.8, goal: 1, constraints: 0 })
  assert.equal(draft.source, 'model')
})

test('normalizeStarterIntakeDraft falls back to source text when fields are missing', () => {
  const draft = normalizeStarterIntakeDraft({ roleId: 'bad' }, '帮我找工具', 'fallback')

  assert.equal(draft.roleId, null)
  assert.equal(draft.outcomeId, null)
  assert.equal(draft.customTask, '帮我找工具')
  assert.equal(draft.sourceText, '帮我找工具')
  assert.equal(draft.source, 'fallback')
})

test('parseStarterIntakeDraftJson rejects invalid model text', () => {
  assert.throws(() => parseStarterIntakeDraftJson('not json', '原始输入'))
})
