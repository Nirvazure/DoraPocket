import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_RECOMMENDATION_PREFERENCES,
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
    matchAssessment: {
      matchScore: score,
      coreTaskSatisfied: true,
      requiredConstraintsSatisfied: true,
      reason: title,
    },
  }
}

test('normalizes invalid recommendation preferences to safe defaults', () => {
  assert.equal(normalizeRecommendationLimit(4), 5)
  for (const value of [undefined, null, {}, { recommendationLimit: 4, minMatchScore: 100 }]) {
    assert.deepEqual(normalizeRecommendationPreferences(value), {
      recommendationLimit: 5,
      minMatchScore: 80,
    })
  }
  assert.deepEqual(DEFAULT_RECOMMENDATION_PREFERENCES, {
    recommendationLimit: 5,
    minMatchScore: 80,
  })
})

for (const [recommendationLimit, minMatchScore] of [
  [3, 90],
  [5, 80],
  [10, 70],
] as const) {
  test(`${recommendationLimit} recommendations derive a ${minMatchScore} percent threshold`, () => {
    for (const legacyScore of [undefined, 0, 100, 'invalid']) {
      assert.deepEqual(
        normalizeRecommendationPreferences({ recommendationLimit, minMatchScore: legacyScore }),
        { recommendationLimit, minMatchScore },
      )
    }
    assert.deepEqual(
      normalizeRecommendationPreferences({ recommendationLimit: String(recommendationLimit) }),
      {
        recommendationLimit,
        minMatchScore,
      },
    )
  })

  test(`${recommendationLimit} recommendations include the threshold boundary without filling lower matches`, () => {
    const results = applyRecommendationPreferences(
      [
        candidate('first', 97),
        candidate('boundary', minMatchScore),
        candidate('below', minMatchScore - 1),
      ],
      { recommendationLimit, minMatchScore: 0 },
    )
    assert.deepEqual(
      results.map((item) => [item.title, item.score]),
      [
        ['first', 97],
        ['boundary', minMatchScore],
      ],
    )
  })

  test(`${recommendationLimit} recommendations cap the total including the primary`, () => {
    const results = applyRecommendationPreferences(
      Array.from({ length: 12 }, (_, index) => candidate(String(index), 100 - index)),
      { recommendationLimit, minMatchScore },
    )
    assert.deepEqual(
      results.map((item) => item.title),
      Array.from({ length: recommendationLimit }, (_, index) => String(index)),
    )
  })
}

test('keeps an empty candidate pool empty', () => {
  assert.deepEqual(applyRecommendationPreferences([]), [])
})

test('default preferences filter candidates below 80 percent', () => {
  assert.deepEqual(
    applyRecommendationPreferences([candidate('first', 100), candidate('second', 75)]).map(
      (item) => item.title,
    ),
    ['first'],
  )
})

test('keeps zero scores empty instead of assigning the first candidate 100 percent', () => {
  const results = applyRecommendationPreferences([candidate('first', 0), candidate('second', 0)], {
    minMatchScore: 100,
    recommendationLimit: 10,
  })

  assert.deepEqual(
    results.map((item) => item.score),
    [],
  )
})

test('cloud storage request excludes unrelated tools even with high retrieval scores', () => {
  const candidates = ['Tauri', 'Sniffnet', 'Search'].map((title) => ({
    ...candidate(title, 100),
    matchAssessment: {
      matchScore: 100,
      coreTaskSatisfied: false,
      requiredConstraintsSatisfied: true,
      reason: 'Does not provide cloud storage',
    },
  }))
  assert.deepEqual(
    applyRecommendationPreferences(candidates, { recommendationLimit: 3, minMatchScore: 90 }),
    [],
  )
})

test('excludes unmet required constraints and unassessed legacy scores', () => {
  const required = candidate('paid only', 99)
  required.matchAssessment!.requiredConstraintsSatisfied = false
  const legacy = candidate('legacy', 1000)
  delete legacy.matchAssessment
  assert.deepEqual(applyRecommendationPreferences([required, legacy]), [])
})

test('sorts absolute match scores and preserves input order for ties', () => {
  const candidates = [
    candidate('first tie', 92),
    candidate('best', 95),
    candidate('second tie', 92),
  ]
  assert.deepEqual(
    applyRecommendationPreferences(candidates).map((item) => [item.title, item.score]),
    [
      ['best', 95],
      ['first tie', 92],
      ['second tie', 92],
    ],
  )
})
