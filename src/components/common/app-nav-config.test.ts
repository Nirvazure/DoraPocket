import assert from 'node:assert/strict'
import test from 'node:test'
import { APP_NAV_ITEMS } from './app-nav-config'

test('APP_NAV_ITEMS defines the shared primary routes in order', () => {
  assert.deepEqual(APP_NAV_ITEMS, [
    { key: 'analysis', label: '分析', href: '/analyse' },
    { key: 'market', label: '道具库', href: '/market' },
  ])
})

test('APP_NAV_ITEMS uses unique route keys and hrefs', () => {
  assert.equal(new Set(APP_NAV_ITEMS.map((item) => item.key)).size, APP_NAV_ITEMS.length)
  assert.equal(new Set(APP_NAV_ITEMS.map((item) => item.href)).size, APP_NAV_ITEMS.length)
})
