import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_RECOMMENDATION_PREFERENCES,
  normalizeMinMatchScore,
  normalizeRecommendationLimit,
  normalizeRecommendationPreferences,
} from '@/shared/discovery/recommendation-preferences'
import { applyRecommendationPreferences } from '@/server/agent/ui-payload'
import type { AgentCandidate } from '@/shared/market/market-types'

function candidate(title: string, score: number): AgentCandidate {
  return {
    title,
    candidateType: 'tool',
    score,
    sourceLabel: 'market',
    reason: title,
  }
}

test('normalizes invalid recommendation preferences to safe defaults', () => {
  assert.equal(normalizeMinMatchScore('not a number'), 70)
  assert.equal(normalizeMinMatchScore(92), 90)
  assert.equal(normalizeMinMatchScore(101), 100)
  assert.equal(normalizeRecommendationLimit(4), 5)
  assert.deepEqual(normalizeRecommendationPreferences({}), DEFAULT_RECOMMENDATION_PREFERENCES)
})

test('applies relative percentage scores, threshold, and total result limit', () => {
  const results = applyRecommendationPreferences(
    [
      candidate('first', 200),
      candidate('second', 150),
      candidate('third', 80),
      candidate('fourth', 20),
    ],
    { minMatchScore: 70, recommendationLimit: 3 },
  )

  assert.deepEqual(
    results.map((item) => [item.title, item.score]),
    [
      ['first', 100],
      ['second', 75],
    ],
  )
})

test('keeps the first candidate at 100 percent when all raw scores are zero', () => {
  const results = applyRecommendationPreferences([candidate('first', 0), candidate('second', 0)], {
    minMatchScore: 100,
    recommendationLimit: 10,
  })

  assert.deepEqual(
    results.map((item) => item.score),
    [100],
  )
})
