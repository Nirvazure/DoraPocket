import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'
import {
  loadUserProfile,
  saveUserProfile,
  subscribeUserProfile,
  type UserProfile,
} from '@/services/user-profile'

export function useUserProfileQuery() {
  return useQuery({
    queryKey: queryKeys.userProfile.current(),
    queryFn: async () => loadUserProfile(),
    staleTime: Infinity,
  })
}

export function useUserProfileSubscription() {
  const queryClient = useQueryClient()

  useEffect(() => {
    return subscribeUserProfile((profile) => {
      queryClient.setQueryData(queryKeys.userProfile.current(), profile)
    })
  }, [queryClient])
}

export function useSaveUserProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation<UserProfile, Error, UserProfile>({
    mutationFn: async (input) => {
      saveUserProfile(input)
      return loadUserProfile()
    },
    onSuccess: (next) => {
      queryClient.setQueryData(queryKeys.userProfile.current(), next)
    },
  })
}
