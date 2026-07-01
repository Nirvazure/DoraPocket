import assert from 'node:assert/strict'
import test from 'node:test'

import {
  appendClarificationTurn,
  canContinueClarify,
  createClarificationSession,
  getVisibleDialogueMessages,
} from '@/shared/discovery/clarification-session'

test('createClarificationSession starts at turn 1 with anchor only in messages after first user turn', () => {
  const session = createClarificationSession('查天气')
  assert.equal(session.turn, 1)
  assert.equal(session.anchorPrompt, '查天气')
  assert.equal(session.messages.length, 0)
  assert.equal(session.status, 'thinking')
})

test('getVisibleDialogueMessages returns last round by default', () => {
  const session = createClarificationSession('查天气')
  const withTurns = appendClarificationTurn(
    appendClarificationTurn(session, { user: '查天气', assistant: '哪个城市？' }),
    { user: '北京', assistant: '好的，我来判断。' },
  )
  const visible = getVisibleDialogueMessages(withTurns, false)
  assert.equal(visible.length, 2)
  assert.equal(visible[0].content, '北京')
  assert.equal(visible[1].content, '好的，我来判断。')
})

test('canContinueClarify is false at turn 3', () => {
  const session = {
    ...createClarificationSession('x'),
    turn: 3 as const,
    status: 'clarifying' as const,
  }
  assert.equal(canContinueClarify(session, false), false)
})
