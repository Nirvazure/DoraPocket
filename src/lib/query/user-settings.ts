import { useLayoutEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthenticatedQueryEnabled } from '@/lib/query/auth-session'
import { apiFetch } from '@/lib/query/api-client'
import { queryKeys } from '@/lib/query/query-keys'
import { applyUserSettingsToDocument } from '@/lib/client/user-settings-document'
import { getDefaultUserSettings, type UserSettings } from '@/shared/user-settings'

const DEFAULT_USER_SETTINGS = getDefaultUserSettings()

export function useUserSettingsQuery() {
  const { enabled } = useAuthenticatedQueryEnabled()

  const query = useQuery({
    queryKey: queryKeys.userSettings.current(),
    enabled,
    queryFn: async () => apiFetch<UserSettings>('/api/me/settings'),
    staleTime: Infinity,
  })

  const data = query.data ?? DEFAULT_USER_SETTINGS
  const fontPreset = data.fontPreset

  useLayoutEffect(() => {
    applyUserSettingsToDocument({ fontPreset })
  }, [fontPreset])

  return {
    ...query,
    data,
  }
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
