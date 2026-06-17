'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthSessionQuery } from '@/lib/query/auth-session'
import { apiFetch } from '@/lib/query/api-client'
import {
  clearLegacyLocalSnapshot,
  collectLegacyLocalSnapshot,
  hasLegacyLocalMigrationData,
} from '@/lib/client/legacy-snapshot-read'

export function AuthBootstrap() {
  const { data } = useAuthSessionQuery()
  const queryClient = useQueryClient()
  const migratedRef = useRef(false)

  useEffect(() => {
    if (!data?.authenticated || migratedRef.current) return

    const snapshot = collectLegacyLocalSnapshot()
    if (!hasLegacyLocalMigrationData(snapshot)) return

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
