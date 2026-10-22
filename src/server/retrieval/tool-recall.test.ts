import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

let embeddings = 0
let unavailable = false
mock.module('@/server/market/tool-catalog', {
  namedExports: { listActiveToolItems: async () => [] },
})
mock.module('@/server/retrieval/tool-embedding', {
  namedExports: {
    embedQuery: async () => {
      embeddings++
      return unavailable ? null : Array(1024).fill(0.1)
    },
    searchToolsByEmbedding: async () => new Map(),
  },
})
const { recallToolMatches } = await import('./tool-recall')

test('recall always attempts vectors, even if a legacy environment flag disables them', async (t) => {
  const original = { ...process.env }
  t.after(() => {
    process.env = original
  })
  process.env.TOOL_VECTOR_RECALL_ENABLED = 'false'
  const result = await recallToolMatches('find a tool', [], {})
  assert.equal(embeddings, 1)
  assert.equal(result.recallSummary?.vectorEnabled, true)
})

test('missing query embeddings still allow keyword recall to complete', async () => {
  unavailable = true
  const result = await recallToolMatches('find a tool', [], {})
  assert.deepEqual(result.matches, [])
  assert.equal(result.recallSummary?.vectorCount, 0)
})
