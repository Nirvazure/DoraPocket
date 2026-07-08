'use client'

import { useCallback } from 'react'
import type { AssistantModeCard } from '@/shared/discovery/mode-registry'
import type { ChatToolPayload } from '@/lib/client/llm'
import { useAuthenticatedToolActions } from '@/hooks/use-authenticated-tool-actions'
import type { ToolLookupFn } from '@/shared/market/tool-lookup'

type UsePocketGadgetModalActionsOptions = {
  authPending: boolean
  isAuthenticated: boolean
  getTool: ToolLookupFn
  selectedToolPayload: ChatToolPayload
  getLatestUserPrompt: () => string
  saveToolToPocket: (input: {
    toolId: string
    sourceQuestion?: string
    presetArgs?: Record<string, unknown>
  }) => void
  markToolUsed: (input: { toolId: string }) => void
}

export function usePocketGadgetModalActions({
  authPending,
  isAuthenticated,
  getTool,
  selectedToolPayload,
  getLatestUserPrompt,
  saveToolToPocket,
  markToolUsed,
}: UsePocketGadgetModalActionsOptions) {
  const { openTool, saveTool } = useAuthenticatedToolActions({
    authPending,
    isAuthenticated,
    markToolUsed,
    saveToolToPocket,
    getSourceQuestion: getLatestUserPrompt,
    getTool,
  })

  const onOpenTool = useCallback(
    (toolId: string) => {
      openTool(toolId)
    },
    [openTool],
  )

  const onSaveToPocket = useCallback(
    (gadget: AssistantModeCard) => {
      if (!gadget.toolId) return
      const presetArgs =
        selectedToolPayload?.toolId === gadget.toolId && selectedToolPayload.args
          ? selectedToolPayload.args
          : undefined
      saveTool(gadget.toolId, presetArgs)
    },
    [saveTool, selectedToolPayload],
  )

  return {
    onOpenTool,
    onSaveToPocket,
  }
}
