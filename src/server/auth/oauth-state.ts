import 'server-only'

import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'

const STATE_COOKIE = 'dp_oauth_state'
const NEXT_COOKIE = 'dp_oauth_next'

type OAuthCookieOptions = {
  httpOnly: true
  secure: boolean
  sameSite: 'lax'
  maxAge: number
  path: '/'
}

function getOAuthCookieOptions(): OAuthCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  }
}

export async function createOAuthState(next = '/analyse') {
  const state = randomBytes(32).toString('hex')
  const safeNext = next.startsWith('/') ? next : '/analyse'
  const cookieStore = await cookies()
  const options = getOAuthCookieOptions()

  cookieStore.set(STATE_COOKIE, state, options)
  cookieStore.set(NEXT_COOKIE, safeNext, options)

  return state
}

export async function consumeOAuthState(state: string | null) {
  const cookieStore = await cookies()
  const expected = cookieStore.get(STATE_COOKIE)?.value
  const next = cookieStore.get(NEXT_COOKIE)?.value || '/analyse'

  cookieStore.delete(STATE_COOKIE)
  cookieStore.delete(NEXT_COOKIE)

  if (!state || !expected || state !== expected) {
    return null
  }

  return { next: next.startsWith('/') ? next : '/analyse' }
}
