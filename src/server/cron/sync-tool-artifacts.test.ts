import assert from 'node:assert/strict'
import test from 'node:test'

import { syncToolArtifacts } from '@/server/cron/sync-tool-artifacts'

const syncedIconUrl = 'https://assets.example.com/storage/tool.png'

test('syncToolArtifacts reports embedding sync when embeddedAt changes', async () => {
  const beforeEmbeddedAt = new Date('2026-01-01T00:00:00.000Z')
  const afterEmbeddedAt = new Date('2026-01-02T00:00:00.000Z')
  let readCount = 0

  const result = await syncToolArtifacts('tool-a', {
    findTool: async () => ({
      id: 'tool-a',
      status: 'active',
      url: null,
      iconImageUrl: null,
      embeddedAt: beforeEmbeddedAt,
    }),
    readToolArtifacts: async () => {
      readCount += 1
      return { embeddedAt: afterEmbeddedAt, iconImageUrl: null }
    },
    syncEmbedding: async () => undefined,
    syncFavicon: async () => undefined,
    isSyncedFaviconUrl: (url) => url === syncedIconUrl,
  })

  assert.equal(readCount, 1)
  assert.equal(result.embeddingSynced, true)
  assert.equal(result.faviconSynced, false)
})

test('syncToolArtifacts reports favicon sync when icon becomes synced asset url', async () => {
  const reads = [
    { embeddedAt: new Date('2026-01-01T00:00:00.000Z'), iconImageUrl: null },
    { embeddedAt: new Date('2026-01-01T00:00:00.000Z'), iconImageUrl: syncedIconUrl },
  ]
  const faviconCalls: Array<{ toolId: string; siteUrl: string }> = []

  const result = await syncToolArtifacts('tool-a', {
    findTool: async () => ({
      id: 'tool-a',
      status: 'active',
      url: 'https://example.com',
      iconImageUrl: null,
      embeddedAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    readToolArtifacts: async () => reads.shift() ?? reads[reads.length - 1] ?? null,
    syncEmbedding: async () => undefined,
    syncFavicon: async (toolId, siteUrl) => {
      faviconCalls.push({ toolId, siteUrl })
    },
    isSyncedFaviconUrl: (url) => url === syncedIconUrl,
  })

  assert.deepEqual(faviconCalls, [{ toolId: 'tool-a', siteUrl: 'https://example.com' }])
  assert.equal(result.embeddingSynced, false)
  assert.equal(result.faviconSynced, true)
})

test('syncToolArtifacts returns no sync result when tool does not exist', async () => {
  const result = await syncToolArtifacts('missing-tool', {
    findTool: async () => null,
    readToolArtifacts: async () => {
      throw new Error('should not read artifacts')
    },
    syncEmbedding: async () => {
      throw new Error('should not sync embedding')
    },
    syncFavicon: async () => {
      throw new Error('should not sync favicon')
    },
    isSyncedFaviconUrl: (url) => url === syncedIconUrl,
  })

  assert.deepEqual(result, { embeddingSynced: false, faviconSynced: false })
})
