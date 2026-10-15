import assert from 'node:assert/strict'
import test from 'node:test'

import { syncPendingTools } from '@/server/cron/sync-pending-tools'
import { buildToolIndex, getEmbeddingConfig } from '@/shared/market/tool-index-content'

const fields = { name: 'Demo', description: 'Tools', category: 'search', tags: ['AI'] }
const currentIndex = {
  ...buildToolIndex(fields),
  embeddingModel: getEmbeddingConfig().model,
  embeddedAt: new Date('2026-01-01'),
}

const syncedIconUrl = 'https://assets.example.com/storage/tool.png'

test('syncPendingTools syncs tools with missing embedding', async () => {
  const syncedIds: string[] = []

  const result = await syncPendingTools(10, {
    findCandidateTools: async () => [
      {
        ...fields,
        index: null,
        id: 'missing-embedding',
        url: null,
        iconUrl: null,
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
        ...fields,
        index: currentIndex,
        id: 'missing-favicon',
        url: 'https://example.com',
        iconUrl: null,
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
        ...fields,
        index: currentIndex,
        id: 'complete',
        url: 'https://example.com',
        iconUrl: syncedIconUrl,
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

test('stale hashes and non-current models are retried even with embeddedAt', async () => {
  const ids: string[] = []
  const candidates = ['hash', 'model'].map((id) => ({
    ...fields,
    id,
    embeddedAt: currentIndex.embeddedAt,
    url: 'https://example.com',
    iconUrl: syncedIconUrl,
    index: {
      ...currentIndex,
      ...(id === 'hash' ? { contentHash: 'old' } : { embeddingModel: 'old-model' }),
    },
  }))
  const result = await syncPendingTools(10, {
    findCandidateTools: async () => candidates,
    syncArtifacts: async (id) => {
      ids.push(id)
      return { embeddingSynced: true, faviconSynced: false }
    },
    isSyncedFaviconUrl: () => true,
  })
  assert.deepEqual(ids, ['hash', 'model'])
  assert.equal(result.embeddingSynced, 2)
})

test('failed sync remains retryable on the next cron run', async () => {
  let attempts = 0
  const deps = {
    findCandidateTools: async () => [
      { ...fields, id: 'retry', url: 'https://example.com', iconUrl: syncedIconUrl, index: null },
    ],
    syncArtifacts: async () => {
      if (++attempts === 1) throw new Error('provider temporarily failed')
      return { embeddingSynced: true, faviconSynced: false }
    },
    isSyncedFaviconUrl: () => true,
  }
  assert.equal((await syncPendingTools(1, deps)).errors, 1)
  assert.equal((await syncPendingTools(1, deps)).embeddingSynced, 1)
  assert.equal(attempts, 2)
})

test('missing vectors take priority over permanently missing favicons', async () => {
  const synced: string[] = []
  await syncPendingTools(1, {
    findCandidateTools: async () => [
      {
        ...fields,
        id: 'old-no-icon',
        url: 'https://example.com',
        iconUrl: null,
        index: currentIndex,
      },
      {
        ...fields,
        id: 'new-no-vector',
        url: 'https://example.com',
        iconUrl: syncedIconUrl,
        index: null,
      },
    ],
    syncArtifacts: async (id) => {
      synced.push(id)
      return { embeddingSynced: true, faviconSynced: false }
    },
  })
  assert.deepEqual(synced, ['new-no-vector'])
})
