import assert from 'node:assert/strict'
import test from 'node:test'
import { safeAuthReturnPath } from './return-path'

test('OAuth preserves local paths and rejects alternate origins and backslashes', () => {
  assert.equal(safeAuthReturnPath('/market?q=write#tools'), '/market?q=write#tools')
  for (const path of [
    null,
    '',
    '//evil.example',
    'https://evil.example',
    '/\\evil.example',
    '/\n/evil.example',
  ]) {
    assert.equal(safeAuthReturnPath(path), '/analyse')
  }
})
