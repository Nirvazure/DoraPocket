import assert from 'node:assert/strict'
import test from 'node:test'

import {
  resolveAgentTurnRequest,
  resolveVoicePlaybackText,
} from '@/app/analyse/_domain/analysis-session'
import { createClarificationSession } from '@/shared/discovery/clarification-session'
import type { AgentUiPayload } from '@/shared/market/market-types'

const reply = (text: string, selectionReason?: string) => ({
  text,
  selectedTool: null,
  uiPayload: selectionReason
    ? ({
        selectionReason,
      } as AgentUiPayload)
    : null,
})

test('resolveAgentTurnRequest returns null for empty text without skip clarify', () => {
  assert.equal(resolveAgentTurnRequest({ text: '   ', priorClarification: null }), null)
})

test('resolveAgentTurnRequest creates a new session for a fresh task', () => {
  const request = resolveAgentTurnRequest({
    text: '  find a writing tool  ',
    priorClarification: null,
  })

  assert.ok(request)
  assert.equal(request.safeText, 'find a writing tool')
  assert.equal(request.isContinuation, false)
  assert.equal(request.session.anchorPrompt, 'find a writing tool')
  assert.equal(request.requestMessage, 'find a writing tool')
})

test('resolveAgentTurnRequest reuses a clarifying session for continuation text', () => {
  const prior = {
    ...createClarificationSession('find a writing tool'),
    status: 'clarifying' as const,
  }

  const request = resolveAgentTurnRequest({ text: ' free first ', priorClarification: prior })

  assert.ok(request)
  assert.equal(request.safeText, 'free first')
  assert.equal(request.isContinuation, true)
  assert.equal(request.session, prior)
  assert.equal(request.requestMessage, 'free first')
})

test('resolveAgentTurnRequest uses skip text for empty skipped clarification', () => {
  const prior = {
    ...createClarificationSession('find a writing tool'),
    status: 'clarifying' as const,
  }

  const request = resolveAgentTurnRequest({
    text: '   ',
    options: { skipClarify: true },
    priorClarification: prior,
  })

  assert.ok(request)
  assert.equal(request.safeText, '')
  assert.equal(request.isContinuation, true)
  assert.equal(request.session, prior)
  assert.equal(request.requestMessage, '跳过')
})

test('resolveAgentTurnRequest creates a session when continuation is requested without prior session', () => {
  const request = resolveAgentTurnRequest({
    text: ' use the browser ',
    options: { isContinuation: true },
    priorClarification: null,
  })

  assert.ok(request)
  assert.equal(request.safeText, 'use the browser')
  assert.equal(request.isContinuation, true)
  assert.equal(request.session.anchorPrompt, 'use the browser')
  assert.equal(request.requestMessage, 'use the browser')
})

test('resolveVoicePlaybackText returns full trimmed text in full mode', () => {
  assert.equal(resolveVoicePlaybackText(reply('  full response  '), 'full'), 'full response')
})

test('resolveVoicePlaybackText prefers selection reason in key-result mode', () => {
  assert.equal(
    resolveVoicePlaybackText(reply('fallback text', 'best match for this task'), 'key-result'),
    'best match for this task',
  )
})

test('resolveVoicePlaybackText truncates long selection reason', () => {
  const reason = 'a'.repeat(130)

  assert.equal(
    resolveVoicePlaybackText(reply('fallback text', reason), 'key-result'),
    `${'a'.repeat(120)}...`,
  )
})

test('resolveVoicePlaybackText returns first sentence when no selection reason exists', () => {
  assert.equal(
    resolveVoicePlaybackText(reply('First sentence. Second sentence.'), 'key-result'),
    'First sentence.',
  )
})

test('resolveVoicePlaybackText returns first Chinese sentence', () => {
  assert.equal(resolveVoicePlaybackText(reply('第一句。第二句。'), 'key-result'), '第一句。')
})

test('resolveVoicePlaybackText returns empty string for empty text', () => {
  assert.equal(resolveVoicePlaybackText(reply('   '), 'key-result'), '')
})
