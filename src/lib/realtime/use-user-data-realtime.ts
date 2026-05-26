'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { handleRealtimeTableChange, type RealtimeTable } from '@/lib/realtime/table-sync-handlers'

const REALTIME_TABLES: RealtimeTable[] = [
  'PocketItem',
  'UserSettings',
  'ChatHistoryEntry',
  'MarketSubmission',
]

const DEBOUNCE_MS = 300

export function useUserDataRealtime(userId: string | undefined) {
  const queryClient = useQueryClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTablesRef = useRef(new Set<RealtimeTable>())

  useEffect(() => {
    if (!userId) return

    const supabase = createSupabaseBrowserClient()
    const channel = supabase.channel(`user-data:${userId}`)

    const flushPending = () => {
      for (const table of pendingTablesRef.current) {
        handleRealtimeTableChange(queryClient, table)
      }
      pendingTablesRef.current.clear()
    }

    const scheduleSync = (table: RealtimeTable) => {
      pendingTablesRef.current.add(table)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(flushPending, DEBOUNCE_MS)
    }

    for (const table of REALTIME_TABLES) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `userId=eq.${userId}`,
        },
        () => scheduleSync(table),
      )
    }

    void channel.subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      void supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
