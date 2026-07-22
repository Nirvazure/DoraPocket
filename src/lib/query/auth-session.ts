import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/query/api-client'

export type AuthSessionUser = {
  id: string
  nickname: string
  avatarSrc?: string | null
  email?: string | null
  bio?: string | null
  website?: string | null
  company?: string | null
  authCreatedAt?: string | null
  lastSignInAt?: string | null
  authRole?: string | null
  authProvider?: string | null
  isMarketOwner?: boolean
}

export function useAuthSessionQuery() {
  return useQuery({
    queryKey: ['authSession'],
    queryFn: async () =>
      apiFetch<{ authenticated: boolean; user?: AuthSessionUser }>('/api/auth/session').catch(
        () => ({ authenticated: false }),
      ),
    staleTime: 30_000,
  })
}

export function useAuthenticatedQueryEnabled() {
  const { data: authSession, isPending: authPending } = useAuthSessionQuery()
  return {
    authPending,
    authenticated: authSession?.authenticated === true,
    enabled: !authPending && authSession?.authenticated === true,
  }
}

export function resolveSettingsReadOnly(
  authPending: boolean,
  authenticated: boolean | undefined,
): boolean {
  if (authPending) return false
  return authenticated !== true
}

export function redirectToLoginUnlessAuthenticated(
  authPending: boolean,
  authenticated: boolean,
): boolean {
  if (authPending) return false
  if (authenticated) return true
  if (typeof window === 'undefined') return false
  const next = `${window.location.pathname}${window.location.search}`
  window.location.href = `/login?next=${encodeURIComponent(next)}`
  return false
}
