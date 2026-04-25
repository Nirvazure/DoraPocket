import { useMemo } from 'react'
import { getToolById } from '@/services/tool-registry'

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
  return useMemo(
    () => ({
      onOpenPocket: () => {
        setAutoSaveNotice(null)
        window.location.href = '/pocket'
      },
      onSaveCandidate: (toolId: string) => {
        saveToolToPocket({
          toolId,
          sourceQuestion: getLatestUserPrompt() || undefined,
        })
        setSystemNotice({ level: 'task', message: '已沉淀为下次可复用入口', autoDismissMs: 2200 })
      },
      onLaunchCandidate: (toolId: string) => {
        const url = getToolById(toolId)?.url
        if (!url) return
        markToolUsed({ toolId })
        window.open(url, '_blank', 'noopener,noreferrer')
      },
      onUndoAutoSave: () => {
        if (!autoSaveNotice) return
        removeToolFromPocket({ toolId: autoSaveNotice.toolId })
        setAutoSaveNotice(null)
      },
      onEnableAutoSave: () => {
        enableAutoSave()
      },
      onFeedback: (toolId: string, vote: 'up' | 'down') => {
        saveMarketFeedback({ toolId, vote })
      },
    }),
    [
      autoSaveNotice,
      enableAutoSave,
      getLatestUserPrompt,
      markToolUsed,
      removeToolFromPocket,
      saveMarketFeedback,
      saveToolToPocket,
      setAutoSaveNotice,
      setSystemNotice,
    ],
  )
}
