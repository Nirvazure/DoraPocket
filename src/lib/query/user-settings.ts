import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/query/api-client'
import { queryKeys } from '@/lib/query/query-keys'
import {
  applyUserSettingsToDocument,
  getDefaultUserSettings,
  type UserSettings,
} from '@/services/user-settings'

export function useUserSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.userSettings.current(),
    queryFn: async () => {
      const next = await apiFetch<UserSettings>('/api/me/settings').catch(() =>
        getDefaultUserSettings(),
      )
      applyUserSettingsToDocument(next)
      return next
    },
    staleTime: Infinity,
  })
}

export function useUserSettingsSubscription() {
  return
}

export function useSaveUserSettingsMutation() {
  const queryClient = useQueryClient()

  return useMutation<UserSettings, Error, UserSettings>({
    mutationFn: async (input) =>
      apiFetch<UserSettings>('/api/me/settings', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: (next) => {
      applyUserSettingsToDocument(next)
      queryClient.setQueryData(queryKeys.userSettings.current(), next)
    },
  })
}
