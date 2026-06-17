'use client'

import { useEffect } from 'react'

export function useAutoDismissSystemNotice({
  systemNotice,
  clearSystemNotice,
}: {
  systemNotice: { autoDismissMs?: number | null } | null
  clearSystemNotice: () => void
}) {
  useEffect(() => {
    if (!systemNotice?.autoDismissMs) return
    const id = window.setTimeout(() => clearSystemNotice(), systemNotice.autoDismissMs)
    return () => window.clearTimeout(id)
  }, [clearSystemNotice, systemNotice])
}
