import assert from 'node:assert/strict'
import test from 'node:test'

import {
  canAdvanceStarterStep,
  canStartStarterAnalysis,
  canStartStructuredAnalysis,
  composeStarterPrompt,
  composeStarterPromptFromVoice,
  createEmptyStarterIntake,
  extractColdStartTaskLine,
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

test('canAdvanceStarterStep treats role as optional and outcome as required before constraints', () => {
  const empty = createEmptyStarterIntake()
  assert.equal(canAdvanceStarterStep(empty, 1), true)
  assert.equal(canAdvanceStarterStep(empty, 2), false)

  const ready = {
    ...empty,
    outcomeId: 'writing' as const,
    customTask: '',
  }
  assert.equal(canAdvanceStarterStep(ready, 2), true)
  assert.equal(canAdvanceStarterStep(ready, 3), true)
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

test('composeStarterPromptFromVoice merges role and constraints with voice task', () => {
  const intake = {
    roleId: 'developer' as const,
    constraintIds: ['citations' as const, 'chinese' as const],
    outcomeId: 'writing' as const,
    customTask: 'ignored when voice wins',
  }
  const prompt = composeStarterPromptFromVoice(intake, '用语音描述的任务')
  assert.match(prompt, /身份：开发/)
  assert.match(prompt, /要附来源/)
  assert.match(prompt, /中文体验/)
  assert.match(prompt, /任务：用语音描述的任务/)
  assert.doesNotMatch(prompt, /ignored when voice wins/)
})

test('composeStarterPromptFromVoice works with empty intake', () => {
  const prompt = composeStarterPromptFromVoice(createEmptyStarterIntake(), '直接说需求')
  assert.match(prompt, /^【冷启动】/)
  assert.match(prompt, /任务：直接说需求/)
})
