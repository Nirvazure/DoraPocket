import assert from 'node:assert/strict'
import test from 'node:test'

import { buildTaskFrame } from '@/server/agent/task-frame'
import { composeStarterPrompt } from '@/shared/starter-intake'

test('buildTaskFrame ignores discovery keywords in cold-start boilerplate', () => {
  const prompt = composeStarterPrompt({
    roleId: 'developer',
    constraintIds: [],
    outcomeId: 'office_tools',
    customTask: '',
  })

  const frame = buildTaskFrame(prompt)

  assert.equal(frame.mode, 'discover')
  assert.match(frame.goal, /办公效率/)
  assert.doesNotMatch(frame.goal, /【冷启动】/)
})

test('buildTaskFrame detects manage_pocket from task line only', () => {
  const frame = buildTaskFrame('【冷启动】\n身份：其他\n约束：无\n任务：帮我把常用工具收进口袋整理')

  assert.equal(frame.mode, 'manage_pocket')
  assert.match(frame.goal, /口袋/)
})

test('buildTaskFrame uses plain user text as goal', () => {
  const frame = buildTaskFrame('查一下北京天气')

  assert.equal(frame.mode, 'discover')
  assert.equal(frame.goal, '查一下北京天气')
})
