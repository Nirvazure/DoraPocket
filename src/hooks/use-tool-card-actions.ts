import { useCallback } from 'react'
import { openToolById, saveToolById } from '@/lib/tool-actions'
import { redirectToLoginUnlessAuthenticated } from '@/lib/query/auth-session'

type UseToolCardActionsOptions = {
  authPending: boolean
  isAuthenticated: boolean
  markToolUsed: (input: { toolId: string }) => void
  saveToolToPocket?: (input: {
    toolId: string
    sourceQuestion?: string
    presetArgs?: Record<string, unknown>
  }) => void
  getSourceQuestion?: () => string | undefined
}

export function useToolCardActions({
  authPending,
  isAuthenticated,
  markToolUsed,
  saveToolToPocket,
  getSourceQuestion,
}: UseToolCardActionsOptions) {
  const openTool = useCallback(
    (toolId: string, url?: string | null) => {
      openToolById(toolId, markToolUsed, { url })
    },
    [markToolUsed],
  )

  const saveTool = useCallback(
    (toolId: string) => {
      if (!redirectToLoginUnlessAuthenticated(authPending, isAuthenticated)) return
      saveToolById(toolId, saveToolToPocket, getSourceQuestion?.())
    },
    [getSourceQuestion, authPending, isAuthenticated, saveToolToPocket],
  )

  return { openTool, saveTool }
}
