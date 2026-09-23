import assert from 'node:assert/strict'
import test from 'node:test'

import { getDatabasePoolMax } from '@/server/db/prisma'

test('getDatabasePoolMax uses a conservative default for the session pooler', () => {
  assert.equal(getDatabasePoolMax(undefined), 5)
})

test('getDatabasePoolMax accepts a positive integer override', () => {
  assert.equal(getDatabasePoolMax('3'), 3)
})

test('getDatabasePoolMax rejects invalid overrides', () => {
  assert.equal(getDatabasePoolMax('0'), 5)
  assert.equal(getDatabasePoolMax('-1'), 5)
  assert.equal(getDatabasePoolMax('not-a-number'), 5)
})
