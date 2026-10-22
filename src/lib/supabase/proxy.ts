import 'server-only'

import { createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  isSupabasePublicConfigAvailable,
} from './config'
import { authCookieOptions } from './cookie-options'

export async function refreshAuthSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const hasSession = request.cookies
    .getAll()
    .some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name))
  if (!hasSession || !isSupabasePublicConfigAvailable()) return response

  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: Parameters<NonNullable<CookieMethodsServer['setAll']>>[0]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })
  try {
    // Refresh before Server Components read the session; their cookie store is read-only.
    await supabase.auth.getUser()
  } catch {
    // The downstream route still verifies identity before accessing private data.
    console.warn('Unable to refresh Supabase session in proxy')
  }
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
