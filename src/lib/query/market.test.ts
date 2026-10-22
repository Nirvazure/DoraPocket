import assert from 'node:assert/strict'
import test from 'node:test'
import { keepMarketDataForViewer } from './market'
import { queryKeys } from './query-keys'

test('search keeps previous results for the same viewer and clears them on account changes', () => {
  const previous: [] = []
  const previousQuery = { queryKey: queryKeys.marketTools.search('image', 'account-a') }
  assert.equal(keepMarketDataForViewer(previous, previousQuery, 'account-a'), previous)
  assert.equal(keepMarketDataForViewer(previous, previousQuery, 'account-b'), undefined)
  assert.equal(keepMarketDataForViewer(previous, previousQuery), undefined)
  assert.equal(keepMarketDataForViewer(previous, undefined, 'account-a'), undefined)
  assert.equal(
    keepMarketDataForViewer(previous, { queryKey: queryKeys.marketTools.search('image') }),
    previous,
  )
})
