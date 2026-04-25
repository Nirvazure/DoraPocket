import { useMemo } from 'react'
import { resolveToolUrlById } from '@/services/tool-registry'

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
  return useMemo(
    () => ({
      openTool: (toolId: string) => {
        const url = resolveToolUrlById(toolId)
        if (!url) return
        markToolUsed({ toolId })
        window.open(url, '_blank', 'noopener,noreferrer')
      },
      saveTool: (toolId: string) => {
        if (!saveToolToPocket) return
        saveToolToPocket({
          toolId,
          sourceQuestion: getSourceQuestion?.(),
        })
      },
    }),
    [getSourceQuestion, markToolUsed, saveToolToPocket],
  )
}
