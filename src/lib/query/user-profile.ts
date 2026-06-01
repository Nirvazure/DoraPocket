import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthenticatedQueryEnabled } from '@/lib/query/auth-session'
import { apiFetch } from '@/lib/query/api-client'
import { queryKeys } from '@/lib/query/query-keys'
import { getDefaultUserProfile, type UserProfile } from '@/lib/client/user-profile'

export function useUserProfileQuery() {
  const { enabled } = useAuthenticatedQueryEnabled()

  const query = useQuery({
    queryKey: queryKeys.userProfile.current(),
    enabled,
    queryFn: async () => apiFetch<UserProfile>('/api/me/profile'),
    staleTime: Infinity,
  })

  return {
    ...query,
    data: query.data ?? getDefaultUserProfile(),
  }
}

export function useUserProfileSubscription() {
  return
}

export function useSaveUserProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation<UserProfile, Error, UserProfile>({
    mutationFn: async (input) =>
      apiFetch<UserProfile>('/api/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.userProfile.current(), next)
    },
  })
}
