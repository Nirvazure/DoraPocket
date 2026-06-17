import assert from 'node:assert/strict'
import test from 'node:test'

import { verifySupabaseWebhookRequest } from '@/server/webhooks/verify-supabase-webhook'

function requestWithAuthorization(value?: string): Request {
  return new Request('https://example.com/api/webhooks/supabase', {
    headers: value ? { Authorization: value } : undefined,
  })
}

test('verifySupabaseWebhookRequest rejects missing Authorization', () => {
  process.env.CRON_SECRET = 'secret'

  assert.equal(verifySupabaseWebhookRequest(requestWithAuthorization()), false)
})

test('verifySupabaseWebhookRequest rejects wrong bearer token', () => {
  process.env.CRON_SECRET = 'secret'

  assert.equal(verifySupabaseWebhookRequest(requestWithAuthorization('Bearer wrong')), false)
})

test('verifySupabaseWebhookRequest accepts correct bearer token', () => {
  process.env.CRON_SECRET = 'secret'

  assert.equal(verifySupabaseWebhookRequest(requestWithAuthorization('Bearer secret')), true)
})
