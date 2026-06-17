import assert from 'node:assert/strict'
import test from 'node:test'

import { recommendationEvaluationInputSchema } from '@/shared/recommendation-evaluation'

test('recommendationEvaluationInputSchema accepts a lightweight helpful evaluation', () => {
  const parsed = recommendationEvaluationInputSchema.parse({
    recommendationSessionId: 'session-1',
    selectedToolId: 'tool-1',
    opened: true,
    tried: true,
    helpful: true,
    outcome: 'helpful',
    rating: 5,
    tags: ['matched_task', 'fast_to_start'],
  })

  assert.equal(parsed.recommendationSessionId, 'session-1')
  assert.equal(parsed.helpful, true)
})

test('recommendationEvaluationInputSchema rejects unknown tags and invalid ratings', () => {
  assert.throws(() =>
    recommendationEvaluationInputSchema.parse({
      recommendationSessionId: 'session-1',
      rating: 6,
      tags: ['unknown'],
    }),
  )
})
