import assert from 'node:assert/strict'
import test from 'node:test'
import { NextRequest } from 'next/server'
import { maintenanceResponse } from './server/maintenance'

test('maintenance blocks pages, APIs, cron and webhook before processing', async () => {
  for (const path of [
    '/',
    '/market',
    '/api/tools',
    '/api/cron/process-jobs',
    '/api/webhooks/database',
  ]) {
    const response = maintenanceResponse(new NextRequest(`https://example.com${path}`), 'true')
    assert.equal(response?.status, 503)
    assert.equal(response?.headers.get('retry-after'), '300')
    assert.equal(response?.headers.get('cache-control'), 'no-store')
    if (path.startsWith('/api/')) {
      assert.deepEqual(await response?.json(), { message: '系统维护中，请稍后再试。' })
    }
  }
})

test('normal operation and framework static assets remain available', () => {
  assert.equal(maintenanceResponse(new NextRequest('https://example.com/market'), 'false'), null)
  assert.equal(maintenanceResponse(new NextRequest('https://example.com/market'), undefined), null)
  for (const path of ['/_next/static/chunk.js', '/_next/image?url=test', '/favicon.ico']) {
    assert.equal(maintenanceResponse(new NextRequest(`https://example.com${path}`), 'true'), null)
  }
})
