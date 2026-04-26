import { useMemo } from 'react'
import {
  ASSISTANT_MODES,
  getModeByToolId,
  type AssistantModeCard,
} from '@/shared/mode-registry'
import type { ChatToolPayload } from '@/services/llm'
import type { AppState } from '@/store'

type UseAppShellStateOptions = {
  appState: AppState
  selectedToolPayload: ChatToolPayload
  toolDialMode: 'quick' | 'all'
  setPocketGadget: (gadget: AssistantModeCard) => void
  setPocketModalOpen: (open: boolean) => void
  closeToolDial: () => void
  setSelectedGadgetKey: (key: string | null) => void
}

export function useAppShellState({
  appState,
  selectedToolPayload,
  toolDialMode,
  setPocketGadget,
  setPocketModalOpen,
  closeToolDial,
  setSelectedGadgetKey,
}: UseAppShellStateOptions) {
  const rootCursor =
    appState === 'thinking' || appState === 'speaking' ? 'cursor-wait' : 'cursor-default'

  const toolBasedGadget = getModeByToolId(selectedToolPayload?.toolId)
  const quickDialGadgets = toolBasedGadget
    ? [toolBasedGadget, ...ASSISTANT_MODES].slice(0, 4)
    : ASSISTANT_MODES.slice(0, 4)
  const dialGadgets = toolDialMode === 'quick' ? quickDialGadgets : ASSISTANT_MODES

  const handleSelectDialGadget = useMemo(
    () => (gadget: AssistantModeCard) => {
      if (!gadget.selectKey && gadget.toolId) {
        setPocketGadget(gadget)
        setPocketModalOpen(true)
        closeToolDial()
        return
      }
      setSelectedGadgetKey(gadget.selectKey ?? null)
      closeToolDial()
    },
    [closeToolDial, setPocketGadget, setPocketModalOpen, setSelectedGadgetKey],
  )

  return {
    rootCursor,
    dialGadgets,
    handleSelectDialGadget,
  }
}
