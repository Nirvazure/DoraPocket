import assert from 'node:assert/strict'
import test from 'node:test'
import { handleDatabaseWebhookEvent } from './handle-database-event'

test('webhooks ignore other schemas and ToolIndex writes', async () => {
  for (const schema of ['public', 'another_app']) {
    assert.deepEqual(
      await handleDatabaseWebhookEvent({
        schema,
        table: 'Tool',
        type: 'INSERT',
        record: { id: 'demo', status: 'active' },
        old_record: null,
      }),
      { handled: false },
    )
  }
  assert.deepEqual(
    await handleDatabaseWebhookEvent({
      schema: 'dorapocket',
      table: 'ToolIndex',
      type: 'UPDATE',
      record: { toolId: 'demo' },
      old_record: null,
    }),
    { handled: false },
  )
})

test('inactive DoraPocket tools are skipped without database or provider calls', async () => {
  assert.deepEqual(
    await handleDatabaseWebhookEvent({
      schema: 'dorapocket',
      table: 'Tool',
      type: 'UPDATE',
      record: { id: 'demo', status: 'inactive' },
      old_record: { id: 'demo', status: 'active' },
    }),
    { handled: true, action: 'tool-sync', outcome: 'skipped' },
  )
})
