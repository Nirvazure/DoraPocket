import assert from 'node:assert/strict'
import test from 'node:test'
import {
  convertTool,
  validateProjectConnection,
  referencedAsset,
  snapshotHash,
  reusableSourceVector,
  sha256,
} from './migration-model'

const base = {
  id: 'a',
  name: 'Tool',
  url: 'https://example.com',
  description: 'Main.',
  category: 'developer',
  tags: ['code'],
  status: 'active',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

test('conversion keeps 13 owner-independent scalar fields and folds useful text once', () => {
  const result = convertTool({
    ...base,
    capabilities: ['Main.', 'Code'],
    recommendedFor: ['Code', 'Teams'],
    sourceNote: 'Teams',
    trustSignals: { riskNote: 'Check output.' },
    source: 'market',
    icon: '🔧',
  })!
  assert.equal(Object.keys(result).length, 13)
  assert.equal(result.description, 'Main.\n\nCode\n\nTeams\n\nCheck output.')
  assert.equal(result.iconUrl, null)
  assert.equal(result.pricingModel, 'unknown')
  assert.equal(result.platform, 'unknown')
  assert.equal(result.requiresAuth, null)
  assert.equal('source' in result, false)
})

test('unusable URLs and reference resources are excluded; old non-active statuses stay inactive', () => {
  assert.equal(convertTool({ ...base, url: 'javascript:alert(1)' }), null)
  assert.equal(convertTool({ ...base, url: null }), null)
  assert.equal(convertTool({ ...base, executionMode: 'reference_only' }), null)
  assert.equal(convertTool({ ...base, source: 'external_resource' }), null)
  assert.equal(convertTool({ ...base, status: 'review' })?.status, 'inactive')
  assert.equal(convertTool({ ...base, status: 'blocked' })?.status, 'inactive')
  assert.equal(convertTool({ ...base, pricingModel: 'subscription' })?.pricingModel, 'subscription')
})

test('Prisma timestamp without timezone remains UTC when exporting on a local machine', () => {
  const tool = convertTool({
    ...base,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  })!
  assert.equal(tool.createdAt, '2026-01-01T00:00:00.000Z')
  assert.equal(tool.updatedAt, '2026-01-01T00:00:00.000Z')
})

test('project validation rejects cross-project, schema and pooler username mistakes', () => {
  assert.doesNotThrow(() =>
    validateProjectConnection(
      'target',
      'https://tfvzcuksahcofooqqezx.supabase.co',
      'postgresql://postgres:secret@db.tfvzcuksahcofooqqezx.supabase.co/postgres?schema=dorapocket',
    ),
  )
  assert.doesNotThrow(() =>
    validateProjectConnection(
      'source',
      'https://eatsznumylwggpvlwkfk.supabase.co',
      'postgresql://postgres.eatsznumylwggpvlwkfk:secret@aws-0-region.pooler.supabase.com/postgres',
    ),
  )
  assert.throws(() =>
    validateProjectConnection(
      'target',
      'https://eatsznumylwggpvlwkfk.supabase.co',
      'postgresql://postgres:x@db.tfvzcuksahcofooqqezx.supabase.co/postgres',
    ),
  )
  assert.throws(() =>
    validateProjectConnection(
      'target',
      'https://tfvzcuksahcofooqqezx.supabase.co',
      'postgresql://postgres.eatsznumylwggpvlwkfk:x@aws-0-r.pooler.supabase.com/postgres',
    ),
  )
  assert.throws(() =>
    validateProjectConnection(
      'target',
      'https://tfvzcuksahcofooqqezx.supabase.co',
      'postgresql://postgres:x@db.tfvzcuksahcofooqqezx.supabase.co/postgres?schema=public',
    ),
  )
})

test('asset rewriting only accepts the precise source bucket and preserves object keys', () => {
  const result = referencedAsset(
    'https://eatsznumylwggpvlwkfk.supabase.co/storage/v1/object/public/market-assets/market-favicons/a%20b.png',
  )!
  assert.equal(result.objectKey, 'market-favicons/a b.png')
  assert.equal(
    result.targetUrl,
    'https://tfvzcuksahcofooqqezx.supabase.co/storage/v1/object/public/dorapocket-market-assets/market-favicons/a%20b.png',
  )
  assert.equal(
    referencedAsset('https://other.supabase.co/storage/v1/object/public/market-assets/a.png'),
    null,
  )
  assert.equal(referencedAsset('/images/tool.png'), null)
  assert.throws(() =>
    referencedAsset(
      'https://eatsznumylwggpvlwkfk.supabase.co/storage/v1/object/public/avatars/a.png',
    ),
  )
})

test('snapshot hash is deterministic, content-sensitive and order-independent by tool ID', () => {
  const a = convertTool(base)!
  const b = convertTool({ ...base, id: 'b' })!
  assert.equal(snapshotHash([a, b]), snapshotHash([b, a]))
  assert.notEqual(snapshotHash([a]), snapshotHash([{ ...a, name: 'Changed' }]))
})

function vectorSource() {
  const content = [
    'Tool',
    'Main.',
    '分类: developer',
    '标签: code',
    '能力: Code',
    '适用于: Teams',
  ].join('\n')
  return {
    ...base,
    capabilities: ['Code'],
    recommendedFor: ['Teams'],
    embedding: JSON.stringify(Array.from({ length: 1024 }, () => 0.125)),
    embeddingModel: 'text-embedding-v3',
    embeddingContentHash: sha256(content),
    embeddedAt: '2026-01-01T00:00:00',
  }
}

test('reusable vectors retain their original content provenance and generation timestamp', () => {
  const source = vectorSource()
  const target = convertTool(source)!
  const result = reusableSourceVector(source, target, 'text-embedding-v3')
  assert.equal(result.vector.length, 1024)
  assert.equal(result.sourceContentHash, source.embeddingContentHash)
  assert.equal(result.embeddedAt, '2026-01-01T00:00:00.000Z')
  assert.equal(result.model, 'text-embedding-v3')
  assert.equal(target.description, 'Main.\n\nCode\n\nTeams')
})

test('vector reuse rejects stale text, another model, invalid vectors and changed target content', () => {
  const source = vectorSource()
  const target = convertTool(source)!
  assert.throws(() =>
    reusableSourceVector({ ...source, description: 'Changed' }, target, 'text-embedding-v3'),
  )
  assert.throws(() =>
    reusableSourceVector({ ...source, embeddingContentHash: 'stale' }, target, 'text-embedding-v3'),
  )
  assert.throws(() => reusableSourceVector(source, target, 'text-embedding-v4'))
  assert.throws(() =>
    reusableSourceVector({ ...source, embedding: '[1,2]' }, target, 'text-embedding-v3'),
  )
  assert.throws(() =>
    reusableSourceVector({ ...source, embedding: 'invalid' }, target, 'text-embedding-v3'),
  )
  assert.throws(() =>
    reusableSourceVector(source, { ...target, description: 'New content' }, 'text-embedding-v3'),
  )
})
