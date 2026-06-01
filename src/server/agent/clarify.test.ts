import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveClarifyOutcome } from '@/server/agent/clarify'
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
