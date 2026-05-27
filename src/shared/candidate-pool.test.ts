import test from 'node:test'
import assert from 'node:assert/strict'

import { mergeCandidatePool, normalizeExternalSuggestions } from '@/shared/candidate-pool'
import type { AgentCandidate } from '@/shared/market-types'

function hubCandidate(id: string, score: number): AgentCandidate {
  return {
    toolId: id,
    title: id,
    candidateType: 'tool',
    score,
    sourceLabel: 'market',
    reason: 'hub',
  }
}

function externalCandidate(title: string, score: number): AgentCandidate {
  return {
    title,
    url: `https://${title.toLowerCase().replace(/\s+/g, '')}.example.com`,
    candidateType: 'external_suggestion',
    score,
    sourceLabel: 'external',
    reason: 'external',
    externalConfidence: score / 100,
  }
}

test('mergeCandidatePool sorts hub and external candidates by score when hub is sufficient', () => {
  const merged = mergeCandidatePool(
    [hubCandidate('hub-a', 40), hubCandidate('hub-b', 55)],
    [],
    [externalCandidate('External A', 82), externalCandidate('External B', 70)],
    false,
    false,
  )

  assert.equal(merged[0]?.title, 'External A')
  assert.equal(merged[1]?.title, 'External B')
  assert.equal(merged[2]?.title, 'hub-b')
  assert.equal(merged.length, 4)
})

test('mergeCandidatePool reserves external slots when hub is insufficient', () => {
  const merged = mergeCandidatePool(
    [hubCandidate('hub-a', 150), hubCandidate('hub-b', 140), hubCandidate('hub-c', 130)],
    [],
    [
      externalCandidate('External A', 82),
      externalCandidate('External B', 78),
      externalCandidate('External C', 74),
    ],
    false,
    true,
  )

  const externalCount = merged.filter((item) => item.candidateType === 'external_suggestion').length
  assert.equal(externalCount, 3)
  assert.ok(merged.some((item) => item.title === 'External A'))
  assert.ok(merged.some((item) => item.title === 'hub-a'))
  assert.equal(merged.length, 5)
})

test('mergeCandidatePool boosts first external when preferExternal is true', () => {
  const merged = mergeCandidatePool(
    [hubCandidate('hub-a', 80)],
    [],
    [externalCandidate('External A', 78)],
    true,
    false,
  )

  assert.equal(merged[0]?.candidateType, 'external_suggestion')
})

test('normalizeExternalSuggestions accepts up to three unique externals', () => {
  const raw = [
    {
      title: 'Tool One',
      url: 'https://one.example.com',
      reason: 'best',
      externalConfidence: 0.8,
    },
    {
      title: 'Tool Two',
      url: 'https://two.example.com',
      reason: 'second',
      externalConfidence: 0.75,
    },
    {
      title: 'Tool Three',
      url: 'https://three.example.com',
      reason: 'third',
      externalConfidence: 0.72,
    },
    {
      title: 'Tool Four',
      url: 'https://four.example.com',
      reason: 'ignored',
      externalConfidence: 0.9,
    },
  ]

  const results = normalizeExternalSuggestions(raw, [], 0.72)
  assert.equal(results.length, 3)
  assert.equal(results[0]?.title, 'Tool One')
})

test('normalizeExternalSuggestions supports legacy singular payload item', () => {
  const results = normalizeExternalSuggestions(
    [
      {
        title: 'Legacy Tool',
        url: 'https://legacy.example.com',
        reason: 'legacy',
        externalConfidence: 0.74,
      },
    ],
    [],
    0.72,
  )

  assert.equal(results.length, 1)
  assert.equal(results[0]?.title, 'Legacy Tool')
})
