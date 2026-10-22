import assert from 'node:assert/strict'
import test from 'node:test'
import { main, request, toolMatches, embeddingFenceTimestamp } from './migrate-dorapocket'
import { convertTool } from './migration-model'

test('historical migration requires explicit source credentials instead of reading runtime .env', async (t) => {
  const original = process.env
  process.env = { ...original }
  for (const name of Object.keys(process.env)) {
    if (/^(SOURCE_|TARGET_)/.test(name)) delete process.env[name]
  }
  t.after(() => {
    process.env = original
  })
  await assert.rejects(main(['inspect']), /Missing migration setting: SOURCE_SUPABASE_URL/)
})

test('the CLI rejects unknown flags and unsafe artifact destinations before reading credentials', async () => {
  await assert.rejects(main(['import', '--overwrite']), /Unknown or incomplete/)
  await assert.rejects(main(['export', '--apply', '--artifact', '.env']), /ignored tmp/)
  await assert.rejects(main(['reset', '--apply']), /Usage:/)
})

test('repeat imports compare every scalar field and the business owner ID', () => {
  const tool = convertTool({
    id: 'a',
    name: 'A',
    url: 'https://example.com',
    description: 'Description',
    category: 'developer',
    tags: ['x'],
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  })!
  const row = {
    ...tool,
    createdAt: new Date(tool.createdAt),
    updatedAt: new Date(tool.updatedAt),
    createdByUserId: 'business-id',
  }
  assert.equal(toolMatches(row, tool, 'business-id'), true)
  assert.equal(toolMatches(row, tool, 'auth-uuid'), false)
  assert.equal(toolMatches({ ...row, description: 'Edited in target' }, tool, 'business-id'), false)
  assert.equal(toolMatches({ ...row, status: 'inactive' }, tool, 'business-id'), false)
})

test('Storage HTTP 400 with JSON statusCode 404 is treated as missing only when allowed', async (context) => {
  let calls = 0
  context.mock.method(globalThis, 'fetch', async () => {
    calls++
    return new Response(JSON.stringify({ statusCode: '404', error: 'not_found' }), { status: 400 })
  })
  assert.equal((await request('https://example.com', {}, true)).status, 404)
  await assert.rejects(request('https://example.com'), /credentials and payload were omitted/)
  assert.equal(calls, 2)
})

test('embedding timestamp fence binds UTC text instead of a pg-localized Date', () => {
  const timestamp = new Date('2026-10-15T02:30:00.000Z')
  const bound = embeddingFenceTimestamp(timestamp)
  assert.equal(typeof bound, 'string')
  assert.equal(bound, '2026-10-15T02:30:00.000Z')
  assert.equal(embeddingFenceTimestamp('2026-10-15T02:30:00.000Z'), bound)
})

test('remote request failures cannot echo provider credential payloads', async (context) => {
  context.mock.method(
    globalThis,
    'fetch',
    async () => new Response('secret-provider-response', { status: 401 }),
  )
  await assert.rejects(request('https://example.com'), (error: unknown) => {
    assert.ok(error instanceof Error)
    assert.equal(error.message.includes('secret-provider-response'), false)
    assert.equal(error.message.includes('example.com'), false)
    return true
  })
})
