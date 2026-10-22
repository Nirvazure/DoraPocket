import assert from 'node:assert/strict'
import test from 'node:test'

Object.defineProperty(globalThis, 'window', {
  value: { addEventListener() {}, removeEventListener() {} },
  configurable: true,
})
const { QueryObserver, focusManager, onlineManager } = await import('@tanstack/react-query')
const { getQueryClient } = await import('./query-client')
const { getPocketInventoryQueryOptions } = await import('./pocket')
const { queryKeys } = await import('./query-keys')
const flush = () => new Promise<void>((resolve) => setImmediate(resolve))

test('queries load on entry and refresh after local actions, without background synchronization', async (t) => {
  t.mock.timers.enable({ apis: ['setInterval'] })
  const client = getQueryClient()
  client.mount()
  let calls = 0
  const observer = new QueryObserver(client, {
    ...getPocketInventoryQueryOptions('account-a'),
    queryFn: async () => {
      calls++
      return []
    },
    staleTime: 0,
  })
  const unsubscribe = observer.subscribe(() => {})
  t.after(() => {
    unsubscribe()
    client.unmount()
    client.clear()
    focusManager.setFocused(undefined)
    onlineManager.setOnline(true)
    delete (globalThis as { window?: unknown }).window
  })
  await flush()
  assert.equal(calls, 1)
  t.mock.timers.tick(120_000)
  await flush()
  assert.equal(calls, 1)
  focusManager.setFocused(false)
  focusManager.setFocused(true)
  await flush()
  assert.equal(calls, 1)
  onlineManager.setOnline(false)
  onlineManager.setOnline(true)
  await flush()
  assert.equal(calls, 1)

  await client.invalidateQueries({ queryKey: queryKeys.pocket.all })
  assert.equal(calls, 2)
  await observer.refetch()
  assert.equal(calls, 3)

  observer.setOptions({
    queryKey: queryKeys.pocket.list('account-b'),
    enabled: false,
    queryFn: async () => [],
  })
  assert.equal(observer.getCurrentResult().data, undefined)
  assert.deepEqual(client.getQueryData(queryKeys.pocket.list('account-a')), [])
})
