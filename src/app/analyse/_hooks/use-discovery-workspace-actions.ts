'use client'

import { useCallback } from 'react'
import { useAuthenticatedToolActions } from '@/hooks/use-authenticated-tool-actions'
import { useSaveRecommendationSessionActionMutation } from '@/lib/query/recommendation-evaluation'
import type { ToolLookupFn } from '@/shared/tool-lookup'

type UseDiscoveryWorkspaceActionsOptions = {
  authPending: boolean
  isAuthenticated: boolean
  getTool: ToolLookupFn
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
  getRecommendationSessionId?: () => string | null
}

export function useDiscoveryWorkspaceActions({
  authPending,
  isAuthenticated,
  getTool,
  getLatestUserPrompt,
  saveToolToPocket,
  markToolUsed,
  setSystemNotice,
  getRecommendationSessionId,
}: UseDiscoveryWorkspaceActionsOptions) {
  const sessionActionMutation = useSaveRecommendationSessionActionMutation()
  const { openTool, saveTool } = useAuthenticatedToolActions({
    authPending,
    isAuthenticated,
    markToolUsed,
    saveToolToPocket,
    getSourceQuestion: getLatestUserPrompt,
    getTool,
  })

  const onSaveCandidate = useCallback(
    (toolId: string) => {
      const saved = saveTool(toolId)
      if (saved) {
        const recommendationSessionId = getRecommendationSessionId?.()
        if (recommendationSessionId) {
          sessionActionMutation.mutate({
            recommendationSessionId,
            toolId,
            action: 'saved',
          })
        }
        return
      }
      if (authPending || !isAuthenticated) return
      setSystemNotice({
        level: 'critical',
        message: '暂时无法收进口袋，请稍后再试。',
        autoDismissMs: 2200,
      })
    },
    [
      authPending,
      getRecommendationSessionId,
      isAuthenticated,
      saveTool,
      sessionActionMutation,
      setSystemNotice,
    ],
  )

  const onLaunchCandidate = useCallback(
    (toolId: string) => {
      openTool(toolId)
      const recommendationSessionId = getRecommendationSessionId?.()
      if (recommendationSessionId) {
        sessionActionMutation.mutate({
          recommendationSessionId,
          toolId,
          action: 'opened',
        })
      }
    },
    [getRecommendationSessionId, openTool, sessionActionMutation],
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
