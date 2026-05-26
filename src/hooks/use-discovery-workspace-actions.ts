import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { openToolById, saveToolById } from '@/lib/tool-actions'
import { SYSTEM_NOTICE_COPY } from '@/shared/ui-copy'

type UseDiscoveryWorkspaceActionsOptions = {
  getLatestUserPrompt: () => string
  saveToolToPocket: (input: {
    toolId: string
    sourceQuestion?: string
    presetArgs?: Record<string, unknown>
  }) => void
  markToolUsed: (input: { toolId: string }) => void
  saveMarketFeedback: (input: { toolId: string; vote: 'up' | 'down' }) => void
  setSystemNotice: (notice: {
    level: 'task' | 'ambient' | 'critical' | 'silent'
    message: string
    autoDismissMs?: number
  }) => void
}

export function useDiscoveryWorkspaceActions({
  getLatestUserPrompt,
  saveToolToPocket,
  markToolUsed,
  saveMarketFeedback,
  setSystemNotice,
}: UseDiscoveryWorkspaceActionsOptions) {
  const router = useRouter()

  const onOpenPocket = useCallback(() => {
    router.push('/market?section=pocket')
  }, [router])

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
    onFeedback,
  }
}
