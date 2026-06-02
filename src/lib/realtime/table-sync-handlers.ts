import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'

export type RealtimeTable = 'PocketItem' | 'UserSettings' | 'MarketSubmission'

export function handleRealtimeTableChange(queryClient: QueryClient, table: RealtimeTable) {
  switch (table) {
    case 'PocketItem':
      void queryClient.invalidateQueries({ queryKey: queryKeys.pocket.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketContext.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.preferenceProfile.all })
      return
    case 'UserSettings':
      void queryClient.invalidateQueries({ queryKey: queryKeys.userSettings.all })
      return
    case 'MarketSubmission':
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketSubmissions.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketActivity.all })
      void queryClient.invalidateQueries({ queryKey: ['marketTools'] })
      void queryClient.invalidateQueries({ queryKey: ['marketTools', 'byIds'] })
      return
  }
}
