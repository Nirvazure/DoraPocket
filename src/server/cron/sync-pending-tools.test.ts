import assert from 'node:assert/strict'
import test from 'node:test'

import { syncPendingTools } from '@/server/cron/sync-pending-tools'

const syncedIconUrl = 'https://assets.example.com/storage/tool.png'

test('syncPendingTools syncs tools with missing embedding', async () => {
  const syncedIds: string[] = []

  const result = await syncPendingTools(10, {
    findCandidateTools: async () => [
      {
        id: 'missing-embedding',
        url: null,
        iconImageUrl: null,
        embeddedAt: null,
      },
    ],
    syncArtifacts: async (toolId) => {
      syncedIds.push(toolId)
      return { embeddingSynced: true, faviconSynced: false }
    },
    isSyncedFaviconUrl: (url) => url === syncedIconUrl,
  })

  assert.deepEqual(syncedIds, ['missing-embedding'])
  assert.equal(result.scanned, 1)
  assert.equal(result.embeddingSynced, 1)
  assert.equal(result.faviconSynced, 0)
  assert.equal(result.errors, 0)
})

test('syncPendingTools syncs tools with existing embedding and missing favicon', async () => {
  const syncedIds: string[] = []

  const result = await syncPendingTools(10, {
    findCandidateTools: async () => [
      {
        id: 'missing-favicon',
        url: 'https://example.com',
        iconImageUrl: null,
        embeddedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
    syncArtifacts: async (toolId) => {
      syncedIds.push(toolId)
      return { embeddingSynced: false, faviconSynced: true }
    },
    isSyncedFaviconUrl: (url) => url === syncedIconUrl,
  })

  assert.deepEqual(syncedIds, ['missing-favicon'])
  assert.equal(result.scanned, 1)
  assert.equal(result.embeddingSynced, 0)
  assert.equal(result.faviconSynced, 1)
  assert.equal(result.errors, 0)
})

test('syncPendingTools skips tools with embedding and synced favicon', async () => {
  const syncedIds: string[] = []

  const result = await syncPendingTools(10, {
    findCandidateTools: async () => [
      {
        id: 'complete',
        url: 'https://example.com',
        iconImageUrl: syncedIconUrl,
        embeddedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
    syncArtifacts: async (toolId) => {
      syncedIds.push(toolId)
      return { embeddingSynced: false, faviconSynced: false }
    },
    isSyncedFaviconUrl: (url) => url === syncedIconUrl,
  })

  assert.deepEqual(syncedIds, [])
  assert.equal(result.scanned, 0)
  assert.equal(result.embeddingSynced, 0)
  assert.equal(result.faviconSynced, 0)
  assert.equal(result.errors, 0)
})
