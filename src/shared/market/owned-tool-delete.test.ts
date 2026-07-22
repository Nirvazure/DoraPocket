import assert from 'node:assert/strict'
import test from 'node:test'

import { MARKET_OWNER_USER_ID } from '@/shared/market/market-owner'
import {
  OwnedToolDeleteError,
  assertOwnedToolDeletable,
  canDeleteOwnedTool,
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

test('assertOwnedToolDeletable throws FORBIDDEN when createdByUserId is null for normal user', () => {
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

test('assertOwnedToolDeletable allows market owner to delete null-owned seed tools', () => {
  assert.doesNotThrow(() =>
    assertOwnedToolDeletable({
      tool: { createdByUserId: null },
      userId: MARKET_OWNER_USER_ID,
    }),
  )
})

test('assertOwnedToolDeletable allows market owner to delete tools attributed to market owner', () => {
  assert.doesNotThrow(() =>
    assertOwnedToolDeletable({
      tool: { createdByUserId: MARKET_OWNER_USER_ID },
      userId: MARKET_OWNER_USER_ID,
    }),
  )
})

test('assertOwnedToolDeletable forbids market owner deleting another user tool', () => {
  assert.throws(
    () =>
      assertOwnedToolDeletable({
        tool: { createdByUserId: 'other-user' },
        userId: MARKET_OWNER_USER_ID,
      }),
    (error: unknown) => error instanceof OwnedToolDeleteError && error.code === 'FORBIDDEN',
  )
})

test('canDeleteOwnedTool and resolveIsOwnedByViewer stay aligned', () => {
  assert.equal(canDeleteOwnedTool({ createdByUserId: 'user-1', userId: 'user-1' }), true)
  assert.equal(canDeleteOwnedTool({ createdByUserId: 'user-1', userId: 'user-2' }), false)
  assert.equal(canDeleteOwnedTool({ createdByUserId: null, userId: 'user-1' }), false)
  assert.equal(canDeleteOwnedTool({ createdByUserId: null, userId: MARKET_OWNER_USER_ID }), true)
  assert.equal(resolveIsOwnedByViewer('user-1', 'user-1'), true)
  assert.equal(resolveIsOwnedByViewer(null, MARKET_OWNER_USER_ID), true)
  assert.equal(resolveIsOwnedByViewer('user-1', null), false)
})
