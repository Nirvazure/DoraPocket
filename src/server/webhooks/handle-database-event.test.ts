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

test('legacy MarketSubmission events are unhandled', async () => {
  assert.deepEqual(
    await handleDatabaseWebhookEvent({
      schema: 'dorapocket',
      table: 'MarketSubmission',
      type: 'INSERT',
      record: { id: 'submission-1', status: 'review' },
      old_record: null,
    }),
    { handled: false },
  )
})

test('Tool inserts and relevant updates synchronize artifacts; unrelated updates skip', async () => {
  const synced: string[] = []
  const syncArtifacts = async (id: string) => {
    synced.push(id)
    return { embeddingSynced: true, faviconSynced: false }
  }
  const record = { id: 'tool-1', status: 'active', name: 'New', url: 'https://example.com' }
  const inserted = await handleDatabaseWebhookEvent(
    { schema: 'dorapocket', table: 'Tool', type: 'INSERT', record, old_record: null },
    { syncArtifacts },
  )
  const updated = await handleDatabaseWebhookEvent(
    {
      schema: 'dorapocket',
      table: 'Tool',
      type: 'UPDATE',
      record,
      old_record: { ...record, name: 'Old' },
    },
    { syncArtifacts },
  )
  const skipped = await handleDatabaseWebhookEvent(
    { schema: 'dorapocket', table: 'Tool', type: 'UPDATE', record, old_record: record },
    { syncArtifacts },
  )
  assert.deepEqual(synced, ['tool-1', 'tool-1'])
  assert.deepEqual(inserted, { handled: true, action: 'tool-sync', outcome: 'synced' })
  assert.deepEqual(updated, { handled: true, action: 'tool-sync', outcome: 'synced' })
  assert.deepEqual(skipped, { handled: true, action: 'tool-sync', outcome: 'skipped' })
})

test('Tool synchronization failures propagate to the API boundary', async () => {
  await assert.rejects(
    handleDatabaseWebhookEvent(
      {
        schema: 'dorapocket',
        table: 'Tool',
        type: 'INSERT',
        record: { id: 'tool-1', status: 'active' },
        old_record: null,
      },
      {
        syncArtifacts: async () => {
          throw new Error('provider internal details')
        },
      },
    ),
    /provider internal details/,
  )
})
