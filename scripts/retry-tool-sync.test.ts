import assert from 'node:assert/strict'
import test from 'node:test'
import { runCli, retryToolSync } from './retry-tool-sync'

const config = {
  DATABASE_URL: 'postgresql://example',
  QWEN_API_KEY: 'qwen-key',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SECRET_KEY: 'storage-key',
}

test('retries artifact synchronization for one active tool', async () => {
  const synced: string[] = []
  const result = await retryToolSync(['--tool-id', 'tool-1'], {
    env: config,
    findTool: async (id) => ({ id, status: 'active' }),
    syncArtifacts: async (id) => {
      synced.push(id)
      return { embeddingSynced: true, faviconSynced: false }
    },
  })
  assert.deepEqual(synced, ['tool-1'])
  assert.deepEqual(result, { toolId: 'tool-1', embeddingSynced: true, faviconSynced: false })
})

test('missing ID, configuration, missing tool and inactive tool fail before synchronization', async () => {
  let calls = 0
  const syncArtifacts = async () => {
    calls += 1
    return { embeddingSynced: false, faviconSynced: false }
  }
  await assert.rejects(retryToolSync([], { env: config, syncArtifacts }), /--tool-id/)
  for (const name of Object.keys(config)) {
    const env = { ...config, [name]: '' }
    await assert.rejects(
      retryToolSync(['--tool-id', 'tool-1'], { env, syncArtifacts }),
      new RegExp(name),
    )
  }
  await assert.rejects(
    retryToolSync(['--tool-id', 'tool-1'], {
      env: config,
      findTool: async () => null,
      syncArtifacts,
    }),
    /not found/,
  )
  await assert.rejects(
    retryToolSync(['--tool-id', 'tool-1'], {
      env: config,
      findTool: async () => ({ id: 'tool-1', status: 'inactive' }),
      syncArtifacts,
    }),
    /not active/,
  )
  assert.equal(calls, 0)
})

test('sync errors produce a nonzero CLI exit code', async () => {
  const errors: string[] = []
  const exitCode = await runCli(
    ['--tool-id', 'tool-1'],
    {
      env: config,
      findTool: async () => ({ id: 'tool-1', status: 'active' }),
      syncArtifacts: async () => {
        throw new Error('provider unavailable')
      },
    },
    { info: () => undefined, error: (message) => errors.push(message) },
  )
  assert.equal(exitCode, 1)
  assert.match(errors[0], /provider unavailable/)
})

test('successful CLI retry returns zero and reports the tool ID', async () => {
  const messages: string[] = []
  const exitCode = await runCli(
    ['--tool-id', 'tool-1'],
    {
      env: config,
      findTool: async () => ({ id: 'tool-1', status: 'active' }),
      syncArtifacts: async () => ({ embeddingSynced: true, faviconSynced: true }),
    },
    { info: (message) => messages.push(message), error: () => undefined },
  )
  assert.equal(exitCode, 0)
  assert.deepEqual(JSON.parse(messages[0]), {
    toolId: 'tool-1',
    embeddingSynced: true,
    faviconSynced: true,
  })
})
