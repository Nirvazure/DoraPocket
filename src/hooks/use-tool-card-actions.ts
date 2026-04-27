import { useCallback } from 'react'
import { openToolById, saveToolById } from '@/lib/tool-actions'

type UseToolCardActionsOptions = {
  markToolUsed: (input: { toolId: string }) => void
  saveToolToPocket?: (input: {
    toolId: string
    sourceQuestion?: string
    presetArgs?: Record<string, unknown>
  }) => void
  getSourceQuestion?: () => string | undefined
}

export function useToolCardActions({
  markToolUsed,
  saveToolToPocket,
  getSourceQuestion,
}: UseToolCardActionsOptions) {
  const openTool = useCallback(
    (toolId: string) => {
      openToolById(toolId, markToolUsed)
    },
    [markToolUsed],
  )

  const saveTool = useCallback(
    (toolId: string) => {
      saveToolById(toolId, saveToolToPocket, getSourceQuestion?.())
    },
    [getSourceQuestion, saveToolToPocket],
  )

  return { openTool, saveTool }
}
