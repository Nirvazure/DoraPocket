import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/query/api-client'

export type AuthSessionUser = {
  id: string
  nickname: string
  avatarSrc?: string | null
  email?: string | null
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

export function resolveSettingsReadOnly(
  authPending: boolean,
  authenticated: boolean | undefined,
): boolean {
  if (authPending) return false
  return authenticated !== true
}
