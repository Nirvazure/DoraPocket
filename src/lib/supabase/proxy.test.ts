import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import { NextRequest } from 'next/server'
import type { CookieMethodsServer } from '@supabase/ssr'

let calls = 0
let outage = false
mock.module('@supabase/ssr', {
  namedExports: {
    createServerClient: (
      _url: string,
      _key: string,
      options: { cookies: CookieMethodsServer; cookieOptions: object },
    ) => {
      calls++
      assert.equal('httpOnly' in options.cookieOptions && options.cookieOptions.httpOnly, true)
      return {
        auth: {
          getUser: async () => {
            if (outage) throw new Error('network')
            options.cookies.setAll!([
              {
                name: 'sb-project-auth-token',
                value: 'refreshed',
                options: { httpOnly: true, sameSite: 'lax', path: '/' },
              },
            ])
            return { data: { user: { id: 'a' } }, error: null }
          },
        },
      }
    },
  },
})
const { refreshAuthSession } = await import('./proxy')

test('anonymous visits do not contact Auth; refreshed cookies reach both the page request and browser', async (t) => {
  const original = { ...process.env }
  t.after(() => {
    process.env = original
  })
  process.env.SUPABASE_URL = 'https://auth.example'
  process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test'
  await refreshAuthSession(new NextRequest('https://dora.example/market'))
  assert.equal(calls, 0)
  const request = new NextRequest('https://dora.example/profile', {
    headers: { cookie: 'sb-project-auth-token=expired' },
  })
  const response = await refreshAuthSession(request)
  assert.equal(calls, 1)
  assert.equal(request.cookies.get('sb-project-auth-token')?.value, 'refreshed')
  assert.equal(response.cookies.get('sb-project-auth-token')?.value, 'refreshed')
  assert.equal(response.cookies.get('sb-project-auth-token')?.httpOnly, true)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  outage = true
  t.mock.method(console, 'warn', () => {})
  const transient = await refreshAuthSession(request)
  assert.equal(transient.status, 200)
})
