import assert from 'node:assert/strict'
import test from 'node:test'

import {
  normalizeMarketSearchQuery,
  resolveCategoryKeysMatchingQuery,
} from '@/shared/market/market-search-query'

test('normalizeMarketSearchQuery trims and rejects short queries', () => {
  assert.equal(normalizeMarketSearchQuery(''), null)
  assert.equal(normalizeMarketSearchQuery('  '), null)
  assert.equal(normalizeMarketSearchQuery('a'), null)
  assert.equal(normalizeMarketSearchQuery('  ab '), 'ab')
})

test('resolveCategoryKeysMatchingQuery matches Chinese category labels', () => {
  const keys = resolveCategoryKeysMatchingQuery('设计')
  assert.ok(keys.includes('design'))
})

test('resolveCategoryKeysMatchingQuery returns empty for non-matching query', () => {
  assert.deepEqual(resolveCategoryKeysMatchingQuery('xyznotacategory'), [])
})
