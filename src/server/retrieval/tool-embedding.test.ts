import assert from 'node:assert/strict'
import test from 'node:test'
import { syncToolEmbedding } from './tool-embedding'
import { buildToolIndex } from '@/shared/market/tool-index-content'

const tool = {
  id: 'demo',
  status: 'active',
  name: 'Demo',
  description: 'Tools',
  category: 'search',
  tags: ['AI'],
}
const config = { model: 'text-embedding-v3', dimensions: 1024 }
const index = {
  ...buildToolIndex(tool, config),
  embeddingModel: config.model,
  embeddedAt: new Date(),
}

test('unchanged content and model preserve the existing embedding', async () => {
  let embeds = 0
  await syncToolEmbedding(tool.id, {
    config,
    prepare: async () => ({ ...index, embeddingModel: config.model }),
    embed: async () => {
      embeds++
      return Array(1024).fill(0.1)
    },
    write: async () => {
      throw new Error('unchanged vectors must not be written')
    },
  })
  assert.equal(embeds, 0)
})

test('stale async result cannot overwrite changed content, inactive tools, or another model', async () => {
  for (const change of ['content', 'status', 'model']) {
    let current = { hash: index.contentHash, status: 'active', model: config.model }
    let stored = false
    await syncToolEmbedding(tool.id, {
      config,
      prepare: async () => ({ ...index, embeddedAt: null }),
      embed: async () => {
        current = {
          ...current,
          ...(change === 'content'
            ? { hash: 'new-content' }
            : change === 'status'
              ? { status: 'inactive' }
              : { model: 'new-model' }),
        }
        return Array(1024).fill(0.1)
      },
      write: async (_id, hash, model) => {
        stored = current.hash === hash && current.model === model && current.status === 'active'
        return stored
      },
    })
    assert.equal(stored, false)
  }
})

test('embedding service failure propagates for manual retry and invalid vectors never write', async () => {
  await assert.rejects(
    syncToolEmbedding(tool.id, {
      config,
      prepare: async () => ({ ...index, embeddedAt: null }),
      embed: async () => {
        throw new Error('provider down')
      },
      write: async () => true,
    }),
    /provider down/,
  )
  await assert.rejects(
    syncToolEmbedding(tool.id, {
      config,
      prepare: async () => ({ ...index, embeddedAt: null }),
      embed: async () => [1, 2],
      write: async () => {
        throw new Error('invalid vector written')
      },
    }),
    /1024/,
  )
})

test('missing embedding configuration fails tool synchronization', async () => {
  const previous = process.env.QWEN_API_KEY
  delete process.env.QWEN_API_KEY
  try {
    await assert.rejects(
      syncToolEmbedding(tool.id, {
        config,
        prepare: async () => ({ ...index, embeddedAt: null }),
      }),
      /QWEN_API_KEY is required/,
    )
  } finally {
    if (previous === undefined) delete process.env.QWEN_API_KEY
    else process.env.QWEN_API_KEY = previous
  }
})
