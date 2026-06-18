import test from 'node:test'
import assert from 'node:assert/strict'

import { __pocketCacheTestUtils } from '@/lib/query/pocket'
import type { PocketInventoryItem } from '@/shared/pocket-types'

const {
  createOptimisticPocketItem,
  optimisticallySavePocketItem,
  optimisticallyRemovePocketItem,
  optimisticallyMarkPocketItemUsed,
} = __pocketCacheTestUtils

function item(overrides: Partial<PocketInventoryItem> & { toolId: string }): PocketInventoryItem {
  return {
    toolId: overrides.toolId,
    savedAt: overrides.savedAt ?? 1,
    lastUsedAt: overrides.lastUsedAt ?? 1,
    useCount: overrides.useCount ?? 0,
    pinned: overrides.pinned ?? false,
    purchased: overrides.purchased ?? false,
    archived: overrides.archived ?? false,
    sourceQuestion: overrides.sourceQuestion,
    presetArgs: overrides.presetArgs,
  }
}

test('createOptimisticPocketItem creates active pocket item from save input', () => {
  assert.deepEqual(
    createOptimisticPocketItem(
      {
        toolId: 'tool-a',
        sourceQuestion: 'from market',
        presetArgs: { mode: 'fast' },
      },
      100,
    ),
    {
      toolId: 'tool-a',
      savedAt: 100,
      lastUsedAt: 100,
      useCount: 0,
      pinned: false,
      purchased: false,
      archived: false,
      sourceQuestion: 'from market',
      presetArgs: { mode: 'fast' },
    },
  )
})

test('optimisticallySavePocketItem inserts unsaved tool at the front', () => {
  const previous = [item({ toolId: 'tool-b', savedAt: 1 })]
  const next = optimisticallySavePocketItem(previous, { toolId: 'tool-a' }, 100)

  assert.deepEqual(
    next.map((entry) => entry.toolId),
    ['tool-a', 'tool-b'],
  )
  assert.equal(next[0]?.archived, false)
  assert.deepEqual(
    previous.map((entry) => entry.toolId),
    ['tool-b'],
  )
})

test('optimisticallySavePocketItem restores archived item without resetting usage metadata', () => {
  const previous = [
    item({
      toolId: 'tool-a',
      savedAt: 10,
      lastUsedAt: 20,
      useCount: 3,
      pinned: true,
      purchased: true,
      archived: true,
      sourceQuestion: 'old',
      presetArgs: { old: true },
    }),
  ]

  const next = optimisticallySavePocketItem(
    previous,
    {
      toolId: 'tool-a',
      sourceQuestion: 'new',
      presetArgs: { new: true },
    },
    100,
  )

  assert.deepEqual(next, [
    {
      toolId: 'tool-a',
      savedAt: 10,
      lastUsedAt: 20,
      useCount: 3,
      pinned: true,
      purchased: true,
      archived: false,
      sourceQuestion: 'new',
      presetArgs: { new: true },
    },
  ])
})

test('optimisticallyRemovePocketItem removes matching tool', () => {
  const previous = [item({ toolId: 'tool-a' }), item({ toolId: 'tool-b' })]
  const next = optimisticallyRemovePocketItem(previous, 'tool-a')

  assert.deepEqual(
    next.map((entry) => entry.toolId),
    ['tool-b'],
  )
  assert.deepEqual(
    previous.map((entry) => entry.toolId),
    ['tool-a', 'tool-b'],
  )
})

test('optimisticallyMarkPocketItemUsed increments existing tool usage', () => {
  const previous = [item({ toolId: 'tool-a', lastUsedAt: 10, useCount: 2 })]
  const next = optimisticallyMarkPocketItemUsed(previous, 'tool-a', 100)

  assert.equal(next[0]?.lastUsedAt, 100)
  assert.equal(next[0]?.useCount, 3)
  assert.equal(previous[0]?.lastUsedAt, 10)
  assert.equal(previous[0]?.useCount, 2)
})

test('optimisticallyMarkPocketItemUsed does not create unsaved tool', () => {
  const previous = [item({ toolId: 'tool-a' })]
  const next = optimisticallyMarkPocketItemUsed(previous, 'tool-b', 100)

  assert.deepEqual(next, previous)
})
