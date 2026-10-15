import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

const statements: { sql: string; params: unknown[] }[] = []
mock.module(new URL('../db/prisma.ts', import.meta.url).href, {
  namedExports: {
    prisma: {
      $queryRawUnsafe: async () => [{ name: 'vector', schema: 'extensions' }],
      $executeRawUnsafe: async (sql: string, ...params: unknown[]) => {
        statements.push({ sql, params })
        return 0
      },
    },
  },
})
const { writeToolEmbedding } = await import('./tool-embedding')
const { updateToolIndex } = await import('../repositories/tool-repo')

test('SQL embedding write is qualified and fenced by hash, active status and configured model', async () => {
  const before = statements.length
  assert.equal(
    await writeToolEmbedding('demo', 'expected-hash', 'some-obsolete-model', Array(1024).fill(0.1)),
    false,
  )
  assert.equal(statements.length, before)
  const currentModel = process.env.QWEN_EMBEDDING_MODEL?.trim() || 'text-embedding-v3'
  assert.equal(
    await writeToolEmbedding('demo', 'expected-hash', currentModel, Array(1024).fill(0.1)),
    false,
  )
  const { sql, params } = statements.at(-1)!
  assert.match(sql, /UPDATE dorapocket\."ToolIndex"/)
  assert.match(sql, /\$1::"extensions"\.vector/)
  assert.match(sql, /t\."status" = 'active'/)
  assert.match(sql, /i\."contentHash" = \$3/)
  assert.deepEqual(params.slice(1), [currentModel, 'expected-hash', 'demo'])
})

test('index replacement invalidates vectors only on changed content or model hash', async () => {
  let statement = ''
  const tx = {
    $executeRawUnsafe: async (sql: string) => {
      statement = sql
      return 1
    },
  }
  await updateToolIndex(tx as Parameters<typeof updateToolIndex>[0], {
    id: 'demo',
    name: 'Demo',
    description: 'Tools',
    category: 'search',
    tags: [],
  })
  assert.match(statement, /ON CONFLICT \("toolId"\) DO UPDATE/)
  assert.match(statement, /"embedding" = NULL/)
  assert.match(statement, /"embeddingModel" = NULL/)
  assert.match(statement, /"embeddedAt" = NULL/)
  assert.match(statement, /"contentHash" IS DISTINCT FROM EXCLUDED\."contentHash"/)
})
