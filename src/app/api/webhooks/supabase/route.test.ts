import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

let failure: Error | null = null
mock.module('@/server/webhooks/verify-supabase-webhook', {
  namedExports: { verifySupabaseWebhookRequest: () => true },
})
mock.module('@/server/webhooks/handle-database-event', {
  namedExports: {
    handleDatabaseWebhookEvent: async () => {
      if (failure) throw failure
      return { handled: false }
    },
  },
})
const { POST } = await import('./route')

test('legacy submission events return unhandled', async () => {
  const response = await POST(
    new Request('https://example.com/api/webhooks/supabase', {
      method: 'POST',
      body: JSON.stringify({
        schema: 'dorapocket',
        table: 'MarketSubmission',
        type: 'INSERT',
        record: { id: 'submission-1' },
      }),
    }),
  )
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true, handled: false })
})

test('Tool sync errors are logged with the tool ID and return a sanitized 5xx', async () => {
  failure = new Error('private provider detail')
  const errors: unknown[][] = []
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    errors.push(args)
  }
  try {
    const response = await POST(
      new Request('https://example.com/api/webhooks/supabase', {
        method: 'POST',
        body: JSON.stringify({
          schema: 'dorapocket',
          table: 'Tool',
          type: 'UPDATE',
          record: { id: 'tool-1' },
        }),
      }),
    )
    assert.equal(response.status, 500)
    assert.deepEqual(await response.json(), { ok: false, message: 'Tool sync failed' })
    assert.equal((errors[0][1] as { toolId: string }).toolId, 'tool-1')
    assert.match(String(errors[0][2]), /private provider detail/)
  } finally {
    console.error = originalError
    failure = null
  }
})
