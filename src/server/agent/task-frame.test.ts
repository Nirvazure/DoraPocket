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

test('buildTaskFrame extracts cold-start role and constraints into structured fields', () => {
  const frame = buildTaskFrame(
    '【冷启动】\n身份：开发\n约束：免费优先、免注册优先、要附来源、中文体验、需要 API\n任务：帮我找一个 PDF 压缩工具',
  )

  assert.equal(frame.role, '开发')
  assert.equal(frame.budgetPreference, 'free_first')
  assert.equal(frame.authPreference, 'no_signup')
  assert.equal(frame.evidenceRequirement, 'citations')
  assert.equal(frame.languagePreference, 'chinese')
  assert.equal(frame.platformPreference, 'api')
  assert.deepEqual(frame.constraints, [
    '免费优先',
    '免注册优先',
    '要附来源',
    '中文体验',
    '需要 API',
  ])
})

test('buildTaskFrame asks high-value questions for broad discovery requests', () => {
  const frame = buildTaskFrame('帮我推荐一个 AI 工具')

  assert.deepEqual(frame.missingInputs, ['使用场景', '预算偏好', '注册偏好'])
  assert.equal(frame.urgency, 'unspecified')
  assert.ok(frame.confidenceDrivers.includes('任务描述过泛'))
})

test('buildTaskFrame detects explicit platform, privacy, team, and urgency constraints', () => {
  const frame = buildTaskFrame('给小团队找一个隐私安全的移动端 AI 会议纪要工具，最好最快上手')

  assert.equal(frame.platformPreference, 'mobile')
  assert.equal(frame.urgency, 'fast_start')
  assert.ok(frame.constraints.includes('隐私敏感'))
  assert.ok(frame.constraints.includes('小团队'))
  assert.equal(frame.missingInputs.includes('平台偏好'), false)
})
