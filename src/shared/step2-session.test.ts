import assert from 'node:assert/strict'
import test from 'node:test'

import {
  appendStep2Turn,
  canContinueClarify,
  createStep2Session,
  getVisibleDialogueMessages,
} from '@/shared/step2-session'

test('createStep2Session starts at turn 1 with anchor only in messages after first user turn', () => {
  const session = createStep2Session('查天气')
  assert.equal(session.turn, 1)
  assert.equal(session.anchorPrompt, '查天气')
  assert.equal(session.messages.length, 0)
  assert.equal(session.status, 'thinking')
})

test('getVisibleDialogueMessages returns last round by default', () => {
  const session = createStep2Session('查天气')
  const withTurns = appendStep2Turn(
    appendStep2Turn(session, { user: '查天气', assistant: '哪个城市？' }),
    { user: '北京', assistant: '好的，我来判断。' },
  )
  const visible = getVisibleDialogueMessages(withTurns, false)
  assert.equal(visible.length, 2)
  assert.equal(visible[0].content, '北京')
  assert.equal(visible[1].content, '好的，我来判断。')
})

test('canContinueClarify is false at turn 3', () => {
  const session = { ...createStep2Session('x'), turn: 3 as const, status: 'clarifying' as const }
  assert.equal(canContinueClarify(session, false), false)
})
