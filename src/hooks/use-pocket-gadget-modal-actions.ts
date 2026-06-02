import type { AssistantModeCard } from '@/shared/mode-registry'
import type { ChatToolPayload } from '@/lib/client/llm'
import { redirectToLoginUnlessAuthenticated } from '@/lib/query/auth-session'
import { openToolById, saveToolById } from '@/lib/tool-actions'
import type { ToolLookupFn } from '@/shared/tool-lookup'

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
  return {
    onOpenTool: (toolId: string) => {
      openToolById(toolId, markToolUsed, { url: getTool(toolId)?.url })
    },
    onSaveToPocket: (gadget: AssistantModeCard) => {
      if (!gadget.toolId) return
      if (!redirectToLoginUnlessAuthenticated(authPending, isAuthenticated)) return

      const presetArgs =
        selectedToolPayload?.toolId === gadget.toolId && selectedToolPayload.args
          ? selectedToolPayload.args
          : undefined

      saveToolById(gadget.toolId, saveToolToPocket, getLatestUserPrompt() || undefined, presetArgs)
    },
  }
}
