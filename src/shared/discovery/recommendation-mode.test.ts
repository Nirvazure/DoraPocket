import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_RECOMMENDATION_MODE,
  normalizeRecommendationMode,
} from '@/shared/discovery/recommendation-mode'

test('normalizeRecommendationMode defaults missing and invalid values to market', () => {
  assert.equal(DEFAULT_RECOMMENDATION_MODE, 'market')
  assert.equal(normalizeRecommendationMode(undefined), 'market')
  assert.equal(normalizeRecommendationMode('unknown'), 'market')
})

test('normalizeRecommendationMode accepts web mode', () => {
  assert.equal(normalizeRecommendationMode('web'), 'web')
})
