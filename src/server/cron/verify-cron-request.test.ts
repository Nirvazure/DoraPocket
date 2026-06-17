import assert from 'node:assert/strict'
import test from 'node:test'

import { verifyCronRequest } from '@/server/cron/verify-cron-request'

function requestWithAuthorization(value?: string): Request {
  return new Request('https://example.com/api/cron/process-jobs', {
    headers: value ? { Authorization: value } : undefined,
  })
}

test('verifyCronRequest rejects missing Authorization', () => {
  process.env.CRON_SECRET = 'secret'

  assert.equal(verifyCronRequest(requestWithAuthorization()), false)
})

test('verifyCronRequest rejects wrong bearer token', () => {
  process.env.CRON_SECRET = 'secret'

  assert.equal(verifyCronRequest(requestWithAuthorization('Bearer wrong')), false)
})

test('verifyCronRequest accepts correct bearer token', () => {
  process.env.CRON_SECRET = 'secret'

  assert.equal(verifyCronRequest(requestWithAuthorization('Bearer secret')), true)
})
