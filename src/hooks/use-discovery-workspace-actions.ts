import { useCallback } from 'react'
import { openToolById, saveToolById } from '@/lib/tool-actions'
import { redirectToLoginUnlessAuthenticated } from '@/lib/query/auth-session'

type UseDiscoveryWorkspaceActionsOptions = {
  authPending: boolean
  isAuthenticated: boolean
  getLatestUserPrompt: () => string
  saveToolToPocket: (input: {
    toolId: string
    sourceQuestion?: string
    presetArgs?: Record<string, unknown>
  }) => void
  markToolUsed: (input: { toolId: string }) => void
  setSystemNotice: (notice: {
    level: 'task' | 'ambient' | 'critical' | 'silent'
    message: string
    autoDismissMs?: number
  }) => void
}

export function useDiscoveryWorkspaceActions({
  authPending,
  isAuthenticated,
  getLatestUserPrompt,
  saveToolToPocket,
  markToolUsed,
  setSystemNotice,
}: UseDiscoveryWorkspaceActionsOptions) {
  const onSaveCandidate = useCallback(
    (toolId: string) => {
      if (!redirectToLoginUnlessAuthenticated(authPending, isAuthenticated)) return

      const saved = saveToolById(toolId, saveToolToPocket, getLatestUserPrompt() || undefined)
      if (!saved) {
        setSystemNotice({
          level: 'critical',
          message: '暂时无法收进口袋，请稍后再试。',
          autoDismissMs: 2200,
        })
      }
    },
    [getLatestUserPrompt, authPending, isAuthenticated, saveToolToPocket, setSystemNotice],
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

  return {
    onSaveCandidate,
    onLaunchCandidate,
    onOpenExternalCandidate,
  }
}
