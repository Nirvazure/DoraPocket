import { useCallback, useState } from 'react'

export function useAutoSavePreference(storageKey: string) {
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      return window.localStorage.getItem(storageKey) !== '0'
    } catch {
      return true
    }
  })

  const enableAutoSave = useCallback(() => {
    setAutoSaveEnabled(true)
    try {
      window.localStorage.setItem(storageKey, '1')
    } catch {
      /* ignore */
    }
  }, [storageKey])

  const disableAutoSave = useCallback(() => {
    setAutoSaveEnabled(false)
    try {
      window.localStorage.setItem(storageKey, '0')
    } catch {
      /* ignore */
    }
  }, [storageKey])

  return {
    autoSaveEnabled,
    setAutoSaveEnabled,
    enableAutoSave,
    disableAutoSave,
  }
}
