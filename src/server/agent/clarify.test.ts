import assert from 'node:assert/strict'
import test from 'node:test'

import { buildClarifyQuestion, resolveClarifyOutcome } from '@/server/agent/clarify'
import { resolveQuickReplies } from '@/server/agent/quick-replies'

test('resolveClarifyOutcome returns clarifying when missing inputs and turn < 3', () => {
  assert.equal(
    resolveClarifyOutcome({ missingInputs: ['城市'], sessionTurn: 1, skipClarify: false }),
    'clarifying',
  )
})

test('resolveClarifyOutcome returns exhausted at turn 3 with missing inputs', () => {
  assert.equal(
    resolveClarifyOutcome({ missingInputs: ['城市'], sessionTurn: 3, skipClarify: false }),
    'exhausted',
  )
})

test('resolveClarifyOutcome limits brief mode to one clarify turn', () => {
  assert.equal(
    resolveClarifyOutcome({
      missingInputs: ['城市'],
      sessionTurn: 1,
      skipClarify: false,
      explanationMode: 'brief',
    }),
    'clarifying',
  )
  assert.equal(
    resolveClarifyOutcome({
      missingInputs: ['城市'],
      sessionTurn: 2,
      skipClarify: false,
      explanationMode: 'brief',
    }),
    'exhausted',
  )
})

test('resolveClarifyOutcome returns ready when no missing inputs', () => {
  assert.equal(
    resolveClarifyOutcome({ missingInputs: [], sessionTurn: 1, skipClarify: false }),
    'ready',
  )
})

test('resolveQuickReplies maps 城市 to preset cities', () => {
  const replies = resolveQuickReplies(['城市'])
  assert.deepEqual(replies, ['北京', '上海', '广州', '深圳'])
})

test('buildClarifyQuestion asks only the highest-value missing input', () => {
  assert.equal(
    buildClarifyQuestion(['预算偏好', '注册偏好', '平台偏好']),
    '这次更看重免费优先，还是可以接受订阅/付费？',
  )
})

test('resolveQuickReplies maps decision inputs to option chips', () => {
  assert.deepEqual(resolveQuickReplies(['预算偏好']), ['免费优先', '可接受订阅', '企业预算'])
  assert.deepEqual(resolveQuickReplies(['注册偏好']), ['免注册优先', '可以注册'])
  assert.deepEqual(resolveQuickReplies(['证据要求']), ['要引用来源', '不需要引用'])
  assert.deepEqual(resolveQuickReplies(['平台偏好']), ['网页端', '移动端', '需要 API'])
})
