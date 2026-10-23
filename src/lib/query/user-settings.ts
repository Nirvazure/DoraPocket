import { useLayoutEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthenticatedQueryEnabled } from '@/lib/query/auth-session'
import { apiFetch } from '@/lib/query/api-client'
import { queryKeys } from '@/lib/query/query-keys'
import { applyUserSettingsToDocument } from '@/lib/client/user-settings-document'
import { getDefaultUserSettings, type UserSettings } from '@/shared/user/user-settings'

const DEFAULT_USER_SETTINGS = getDefaultUserSettings()

export function useUserSettingsQuery() {
  const { enabled, userId } = useAuthenticatedQueryEnabled()

  const query = useQuery({
    queryKey: queryKeys.userSettings.current(userId),
    enabled,
    queryFn: ({ signal }) => apiFetch<UserSettings>('/api/me/settings', { signal }),
    staleTime: Infinity,
  })

  const data = (enabled ? query.data : undefined) ?? DEFAULT_USER_SETTINGS
  const fontPreset = data.fontPreset

  useLayoutEffect(() => {
    applyUserSettingsToDocument({ fontPreset })
  }, [fontPreset])

  return {
    ...query,
    data,
  }
}
