'use client'

import { useEffect, useState } from 'react'

const COMPACT_STAGE_QUERY = '(max-width: 1023px)'

export function usePrefersCompactStage() {
  const [prefersCompact, setPrefersCompact] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(COMPACT_STAGE_QUERY).matches
  })

  useEffect(() => {
    const media = window.matchMedia(COMPACT_STAGE_QUERY)
    const sync = () => setPrefersCompact(media.matches)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return prefersCompact
}
