import 'server-only'

import { cookies } from 'next/headers'
import type { CookieMethodsServer } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/config'

export { createSupabaseAdminClient } from '@/lib/supabase/admin-client'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        try {
          cookieStore.set(name, value, options)
        } catch {
          // Server Components can read cookies without being allowed to persist them.
        }
      })
    },
  }

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: cookieMethods,
  })
}
