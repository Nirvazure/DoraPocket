import assert from 'node:assert/strict'
import test from 'node:test'
import { buildToolIndex, EMBEDDING_CONFIG } from './tool-index-content'

const tool = {
  name: 'Demo',
  description: 'Find useful tools',
  category: 'search',
  tags: ['AI', 'web'],
}

test('index content has fixed canonical lines and model-dependent hashes', () => {
  const first = buildToolIndex(tool, { model: 'text-embedding-v3', dimensions: 1024 })
  assert.equal(
    first.content,
    'Name: Demo\nDescription: Find useful tools\nCategory: search\nTags: AI, web',
  )
  assert.equal(
    first.contentHash,
    buildToolIndex({ ...tool }, { model: 'text-embedding-v3', dimensions: 1024 }).contentHash,
  )
  assert.notEqual(
    first.contentHash,
    buildToolIndex(tool, { model: 'different-model', dimensions: 1024 }).contentHash,
  )
  assert.notEqual(
    first.contentHash,
    buildToolIndex({ ...tool, tags: ['web'] }, { model: 'text-embedding-v3', dimensions: 1024 })
      .contentHash,
  )
})

test('embedding configuration fixes model and storage dimension', () => {
  assert.deepEqual(EMBEDDING_CONFIG, { model: 'text-embedding-v3', dimensions: 1024 })
})
