import assert from 'node:assert/strict'
import test from 'node:test'

import {
  OwnedToolDeleteError,
  assertOwnedToolDeletable,
  resolveIsOwnedByViewer,
} from '@/shared/market/owned-tool-delete'

test('assertOwnedToolDeletable throws NOT_FOUND when tool is missing', () => {
  assert.throws(
    () => assertOwnedToolDeletable({ tool: null, userId: 'user-1' }),
    (error: unknown) => error instanceof OwnedToolDeleteError && error.code === 'NOT_FOUND',
  )
})

test('assertOwnedToolDeletable throws FORBIDDEN when owner mismatches', () => {
  assert.throws(
    () =>
      assertOwnedToolDeletable({
        tool: { createdByUserId: 'other' },
        userId: 'user-1',
      }),
    (error: unknown) => error instanceof OwnedToolDeleteError && error.code === 'FORBIDDEN',
  )
})

test('assertOwnedToolDeletable throws FORBIDDEN when createdByUserId is null', () => {
  assert.throws(
    () =>
      assertOwnedToolDeletable({
        tool: { createdByUserId: null },
        userId: 'user-1',
      }),
    (error: unknown) => error instanceof OwnedToolDeleteError && error.code === 'FORBIDDEN',
  )
})

test('assertOwnedToolDeletable allows matching owner', () => {
  assert.doesNotThrow(() =>
    assertOwnedToolDeletable({
      tool: { createdByUserId: 'user-1' },
      userId: 'user-1',
    }),
  )
})

test('resolveIsOwnedByViewer is true only for matching viewer', () => {
  assert.equal(resolveIsOwnedByViewer('user-1', 'user-1'), true)
  assert.equal(resolveIsOwnedByViewer('user-1', 'user-2'), false)
  assert.equal(resolveIsOwnedByViewer(null, 'user-1'), false)
  assert.equal(resolveIsOwnedByViewer('user-1', null), false)
})
