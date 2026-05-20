import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { openToolById, saveToolById } from '@/lib/tool-actions'
import { SYSTEM_NOTICE_COPY } from '@/shared/ui-copy'

type AutoSaveNotice = { toolId: string; label: string } | null

type UseDiscoveryWorkspaceActionsOptions = {
  autoSaveNotice: AutoSaveNotice
  getLatestUserPrompt: () => string
  saveToolToPocket: (input: {
    toolId: string
    sourceQuestion?: string
    presetArgs?: Record<string, unknown>
  }) => void
  removeToolFromPocket: (input: { toolId: string }) => void
  markToolUsed: (input: { toolId: string }) => void
  saveMarketFeedback: (input: { toolId: string; vote: 'up' | 'down' }) => void
  setAutoSaveNotice: (notice: AutoSaveNotice) => void
  setSystemNotice: (notice: {
    level: 'task' | 'ambient' | 'critical' | 'silent'
    message: string
    autoDismissMs?: number
  }) => void
  enableAutoSave: () => void
}

export function useDiscoveryWorkspaceActions({
  autoSaveNotice,
  getLatestUserPrompt,
  saveToolToPocket,
  removeToolFromPocket,
  markToolUsed,
  saveMarketFeedback,
  setAutoSaveNotice,
  setSystemNotice,
  enableAutoSave,
}: UseDiscoveryWorkspaceActionsOptions) {
  const router = useRouter()

  const onOpenPocket = useCallback(() => {
    setAutoSaveNotice(null)
    router.push('/pocket')
  }, [router, setAutoSaveNotice])

  const onSaveCandidate = useCallback(
    (toolId: string) => {
      saveToolById(toolId, saveToolToPocket, getLatestUserPrompt() || undefined)
      setSystemNotice({
        level: 'task',
        message: SYSTEM_NOTICE_COPY.savedForLater,
        autoDismissMs: 2200,
      })
    },
    [getLatestUserPrompt, saveToolToPocket, setSystemNotice],
  )

  const onLaunchCandidate = useCallback(
    (toolId: string) => {
      openToolById(toolId, markToolUsed)
    },
    [markToolUsed],
  )

  const onOpenExternalCandidate = useCallback(
    (url: string) => {
      try {
        const parsed = new URL(url)
        if (!['http:', 'https:'].includes(parsed.protocol)) return
        window.open(parsed.toString(), '_blank', 'noopener,noreferrer')
        setSystemNotice({
          level: 'task',
          message: '已打开外部建议，试用有效后可手动提交到 Tool Hub。',
          autoDismissMs: 2200,
        })
      } catch {
        setSystemNotice({
          level: 'critical',
          message: '外部建议链接无效，暂时不能打开。',
          autoDismissMs: 2200,
        })
      }
    },
    [setSystemNotice],
  )

  const onUndoAutoSave = useCallback(() => {
    if (!autoSaveNotice) return
    removeToolFromPocket({ toolId: autoSaveNotice.toolId })
    setAutoSaveNotice(null)
  }, [autoSaveNotice, removeToolFromPocket, setAutoSaveNotice])

  const onEnableAutoSave = useCallback(() => {
    enableAutoSave()
  }, [enableAutoSave])

  const onFeedback = useCallback(
    (toolId: string, vote: 'up' | 'down') => {
      saveMarketFeedback({ toolId, vote })
    },
    [saveMarketFeedback],
  )

  return {
    onOpenPocket,
    onSaveCandidate,
    onLaunchCandidate,
    onOpenExternalCandidate,
    onUndoAutoSave,
    onEnableAutoSave,
    onFeedback,
  }
}
