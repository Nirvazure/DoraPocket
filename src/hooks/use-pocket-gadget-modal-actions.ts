import type { AssistantModeCard } from '@/shared/mode-registry'
import type { ChatToolPayload } from '@/lib/client/llm'
import { openToolById, saveToolById } from '@/lib/tool-actions'

type UsePocketGadgetModalActionsOptions = {
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
  selectedToolPayload,
  getLatestUserPrompt,
  saveToolToPocket,
  markToolUsed,
}: UsePocketGadgetModalActionsOptions) {
  return {
    onOpenTool: (toolId: string) => {
      openToolById(toolId, markToolUsed)
    },
    onSaveToPocket: (gadget: AssistantModeCard) => {
      if (!gadget.toolId) return
      const presetArgs =
        selectedToolPayload?.toolId === gadget.toolId && selectedToolPayload.args
          ? selectedToolPayload.args
          : undefined

      saveToolById(gadget.toolId, saveToolToPocket, getLatestUserPrompt() || undefined, presetArgs)
    },
  }
}
