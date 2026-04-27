'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthSessionQuery } from '@/lib/query/auth-session'
import { apiFetch } from '@/lib/query/api-client'
import { clearLegacyLocalSnapshot, collectLegacyLocalSnapshot } from '@/lib/local-snapshot'

export function AuthBootstrap() {
  const { data } = useAuthSessionQuery()
  const queryClient = useQueryClient()
  const migratedRef = useRef(false)

  useEffect(() => {
    if (!data?.authenticated || migratedRef.current) return

    const snapshot = collectLegacyLocalSnapshot()
    const hasLocalData =
      snapshot.pocketInventory.length > 0 ||
      snapshot.marketFeedback.length > 0 ||
      snapshot.marketSubscriptions.length > 0 ||
      snapshot.marketSubmissions.length > 0 ||
      snapshot.chatHistory.length > 0
    if (!hasLocalData) return

    migratedRef.current = true
    void apiFetch('/api/system/migrate-local', {
      method: 'POST',
      body: JSON.stringify({ snapshot }),
    })
      .then(() => {
        clearLegacyLocalSnapshot()
        void queryClient.invalidateQueries()
      })
      .catch(() => {
        migratedRef.current = false
      })
  }, [data, queryClient])

  return null
}
