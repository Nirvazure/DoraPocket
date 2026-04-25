import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStore } from '@/store'
import { playAudioStream, playDoraPocketSfx, stopAudioPlayback } from '@/services/audio'
import { askQwen, type ChatToolPayload } from '@/services/llm'
import { buildTTSAudioUrl } from '@/services/tts'
import { getToolById } from '@/services/tool-registry'
import {
  getModeByToolId,
  pickModeCardAfterTurn,
  type AssistantModeCard,
} from '@/shared/mode-registry'
import type { AgentUiPayload } from '@/shared/market-types'
import { getMarketContextQueryOptions } from '@/lib/query/market'
import { queryKeys } from '@/lib/query/query-keys'
import type { AppState } from '@/store'

type RunTurnOptions = {
  answerBookFromPocket?: boolean
  skipPostAnswerPocket?: boolean
}

type PocketInventoryItem = {
  toolId: string
}

type UseAnalysisSessionOptions = {
  autoSaveEnabled: boolean
  pocketInventory: PocketInventoryItem[]
  saveChatHistory: (input: {
    userText: string
    assistantText: string
    selectedToolId?: string
  }) => void
  saveToolToPocket: (input: {
    toolId: string
    sourceQuestion?: string
    presetArgs?: Record<string, unknown>
  }) => Promise<unknown>
  setAppState: (state: AppState) => void
  setTranscript: (text: string) => void
  setBotResponse: (text: string) => void
  setLastSpeechError: (message: string) => void
  setSystemNotice: (notice: {
    level: 'task' | 'ambient' | 'critical' | 'silent'
    message: string
    autoDismissMs?: number
  }) => void
  getSelectedGadgetKey: () => string | null
  onPocketGadgetChange: (gadget: AssistantModeCard) => void
}

export function useAnalysisSession({
  autoSaveEnabled,
  pocketInventory,
  saveChatHistory,
  saveToolToPocket,
  setAppState,
  setTranscript,
  setBotResponse,
  setLastSpeechError,
  setSystemNotice,
  getSelectedGadgetKey,
  onPocketGadgetChange,
}: UseAnalysisSessionOptions) {
  const queryClient = useQueryClient()
  const pocketReachTimerRef = useRef(0)
  const latestUserPromptRef = useRef('')
  const [selectedToolPayload, setSelectedToolPayload] = useState<ChatToolPayload>(null)
  const [agentUiPayload, setAgentUiPayload] = useState<AgentUiPayload | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null)
  const [autoSaveNotice, setAutoSaveNotice] = useState<{ toolId: string; label: string } | null>(
    null,
  )

  const finishSpeakingTurn = useCallback(
    (_skipPocket?: boolean) => {
      void _skipPocket
      setAppState('idle')
      setTranscript('')
      setBotResponse('')
    },
    [setAppState, setBotResponse, setTranscript],
  )

  const triggerPocketReveal = useCallback(
    (gadget: AssistantModeCard) => {
      onPocketGadgetChange(gadget)
      void playDoraPocketSfx()
      window.clearTimeout(pocketReachTimerRef.current)
      pocketReachTimerRef.current = window.setTimeout(() => {
        pocketReachTimerRef.current = 0
      }, 1050)
    },
    [onPocketGadgetChange],
  )

  const clearResponseState = useCallback(() => {
    setLastSpeechError('')
    setSelectedToolPayload(null)
    setAgentUiPayload(null)
  }, [setLastSpeechError])

  const runAgentTurn = useCallback(
    async (text: string, options?: RunTurnOptions) => {
      const safeText = text.trim()
      if (!safeText) return

      stopAudioPlayback()
      setLastSpeechError('')
      setBotResponse('')
      setAppState('thinking')
      latestUserPromptRef.current = safeText
      setCurrentPrompt(safeText)
      const marketContext = await queryClient.fetchQuery(getMarketContextQueryOptions('applied'))
      const reply = await askQwen(safeText, {
        answerBookFromPocket: options?.answerBookFromPocket === true,
        marketContext,
        onMeta: ({ selectedTool, uiPayload }) => {
          setSelectedToolPayload(selectedTool)
          setAgentUiPayload(uiPayload)
        },
        onDelta: (chunk) => {
          setBotResponse(`${useStore.getState().botResponse}${chunk}`)
        },
      })
      const answer = reply.text
      setSelectedToolPayload(reply.selectedTool)
      setAgentUiPayload(reply.uiPayload)
      saveChatHistory({
        userText: safeText,
        assistantText: answer,
        selectedToolId: reply.selectedTool?.toolId,
      })
      const pocketKey = getSelectedGadgetKey()
      const nextPocketGadget = pickModeCardAfterTurn(pocketKey, reply.selectedTool?.toolId)
      onPocketGadgetChange(nextPocketGadget)
      if (reply.selectedTool?.toolId) {
        triggerPocketReveal(nextPocketGadget)
      }
      const latestPocketInventory =
        queryClient.getQueryData<PocketInventoryItem[]>(queryKeys.pocket.list()) ?? pocketInventory
      const existingPocketItem = latestPocketInventory.find(
        (item) => item.toolId === reply.selectedTool?.toolId,
      )
      if (
        autoSaveEnabled &&
        reply.uiPayload?.shouldAutoSave &&
        reply.selectedTool?.toolId &&
        !existingPocketItem
      ) {
        await saveToolToPocket({
          toolId: reply.selectedTool.toolId,
          sourceQuestion: safeText,
          presetArgs: reply.selectedTool.args,
        })
        setAutoSaveNotice({
          toolId: reply.selectedTool.toolId,
          label:
            getToolById(reply.selectedTool.toolId)?.name ??
            getModeByToolId(reply.selectedTool.toolId)?.title ??
            reply.selectedTool.toolId,
        })
        setSystemNotice({ level: 'task', message: '已沉淀为可复用入口', autoDismissMs: 2200 })
      }

      const audioUrl = await buildTTSAudioUrl(answer)
      setBotResponse(answer)

      if (audioUrl) {
        setAppState('speaking')
        playAudioStream(audioUrl, () => {
          finishSpeakingTurn(options?.skipPostAnswerPocket === true)
        })
      } else {
        finishSpeakingTurn(options?.skipPostAnswerPocket === true)
      }
    },
    [
      autoSaveEnabled,
      finishSpeakingTurn,
      getSelectedGadgetKey,
      onPocketGadgetChange,
      pocketInventory,
      queryClient,
      saveChatHistory,
      saveToolToPocket,
      setAppState,
      setBotResponse,
      setLastSpeechError,
      setSystemNotice,
      triggerPocketReveal,
    ],
  )

  useEffect(() => {
    return () => {
      window.clearTimeout(pocketReachTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!autoSaveNotice) return
    const id = window.setTimeout(() => setAutoSaveNotice(null), 3600)
    return () => window.clearTimeout(id)
  }, [autoSaveNotice])

  return {
    selectedToolPayload,
    agentUiPayload,
    currentPrompt,
    autoSaveNotice,
    latestUserPromptRef,
    setAutoSaveNotice,
    setSelectedToolPayload,
    setAgentUiPayload,
    clearResponseState,
    runAgentTurn,
  }
}
