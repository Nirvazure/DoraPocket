import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query/query-keys'

export type RealtimeTable = 'PocketItem' | 'UserSettings' | 'MarketSubmission' | 'MarketFeedback'

export function handleRealtimeTableChange(queryClient: QueryClient, table: RealtimeTable) {
  switch (table) {
    case 'PocketItem':
      void queryClient.invalidateQueries({ queryKey: queryKeys.pocket.all })
      return
    case 'UserSettings':
      void queryClient.invalidateQueries({ queryKey: queryKeys.userSettings.all })
      return
    case 'MarketSubmission':
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketTools.all })
      return
    case 'MarketFeedback':
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketReviewAggregates.all })
      return
  }
}
