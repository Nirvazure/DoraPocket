import { useCallback, useEffect, useRef, useState } from 'react'

export type ToolDialMode = 'quick' | 'all'

export function useToolDial() {
  const [toolDialOpen, setToolDialOpen] = useState(false)
  const [toolDialMode, setToolDialMode] = useState<ToolDialMode>('quick')
  const toolDialRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!toolDialOpen) return
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!toolDialRef.current?.contains(target)) {
        setToolDialOpen(false)
        setToolDialMode('quick')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [toolDialOpen])

  const closeToolDial = useCallback(() => {
    setToolDialOpen(false)
    setToolDialMode('quick')
  }, [])

  const toggleToolDial = useCallback(() => {
    setToolDialOpen((open) => !open)
    setToolDialMode('quick')
  }, [])

  return {
    toolDialOpen,
    toolDialMode,
    toolDialRef,
    setToolDialMode,
    closeToolDial,
    toggleToolDial,
  }
}
