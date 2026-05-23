'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { playAudioStream, playDoraPocketSfx, stopAudioPlayback } from '@/services/audio'
import { askQwen, type ChatToolPayload } from '@/services/llm'
import { buildTTSAudioUrl } from '@/services/tts'
import { getToolById } from '@/services/tool-registry'
import type { UserSettings } from '@/services/user-settings'
import {
  getModeByToolId,
  pickModeCardAfterTurn,
  type AssistantModeCard,
} from '@/shared/mode-registry'
import type { AgentUiPayload } from '@/shared/market-types'
import { SYSTEM_NOTICE_COPY } from '@/shared/ui-copy'
import type { AppState } from '@/store'

type RunTurnOptions = {
  answerBookFromPocket?: boolean
}

type PocketInventoryItem = {
  toolId: string
}

type UseAnalysisSessionOptions = {
  autoSaveEnabled: boolean
  userSettings?: UserSettings
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
  onCoverRecommendation: () => void
  onRevealRecommendation: () => void
}

type AgentTurnReply = {
  text: string
  selectedTool: ChatToolPayload
  uiPayload: AgentUiPayload | null
}

export function useAnalysisSession({
  autoSaveEnabled,
  userSettings,
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
  onCoverRecommendation,
  onRevealRecommendation,
}: UseAnalysisSessionOptions) {
  const pocketReachTimerRef = useRef(0)
  const latestUserPromptRef = useRef('')
  const responseBufferRef = useRef('')
  const [selectedToolPayload, setSelectedToolPayload] = useState<ChatToolPayload>(null)
  const [agentUiPayload, setAgentUiPayload] = useState<AgentUiPayload | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null)
  const [autoSaveNotice, setAutoSaveNotice] = useState<{ toolId: string; label: string } | null>(
    null,
  )
  const voicePlaybackMode = userSettings?.voicePlaybackMode ?? 'key-result'
  const voicePlaybackEnabled =
    userSettings?.voicePlaybackEnabled !== false && voicePlaybackMode !== 'off'
  const soundEffectsEnabled = userSettings?.soundEffectsEnabled !== false
  const memoryEnabled = userSettings?.memoryEnabled !== false
  const explanationMode = userSettings?.explanationMode ?? 'standard'

  const finishSpeakingTurn = useCallback(() => {
    setAppState('idle')
    setTranscript('')
    setBotResponse('')
  }, [setAppState, setBotResponse, setTranscript])

  const triggerPocketReveal = useCallback(
    (gadget: AssistantModeCard) => {
      onPocketGadgetChange(gadget)
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

  const handleReplyMeta = useCallback(
    ({
      selectedTool,
      uiPayload,
    }: {
      selectedTool: ChatToolPayload
      uiPayload: AgentUiPayload | null
    }) => {
      setSelectedToolPayload(selectedTool)
      setAgentUiPayload(uiPayload)
      if (selectedTool?.toolId || uiPayload) {
        onCoverRecommendation()
      }
    },
    [onCoverRecommendation],
  )

  const handleReplyDelta = useCallback(
    (chunk: string) => {
      responseBufferRef.current += chunk
      setBotResponse(responseBufferRef.current)
    },
    [setBotResponse],
  )

  const maybeAutoSaveTool = useCallback(
    async (safeText: string, reply: AgentTurnReply) => {
      const toolId = reply.selectedTool?.toolId
      if (!autoSaveEnabled || !reply.uiPayload?.shouldAutoSave || !toolId) return

      const existingPocketItem = pocketInventory.find((item) => item.toolId === toolId)
      if (existingPocketItem) return

      await saveToolToPocket({
        toolId,
        sourceQuestion: safeText,
        presetArgs: reply.selectedTool?.args,
      })
      setAutoSaveNotice({
        toolId,
        label: getToolById(toolId)?.name ?? getModeByToolId(toolId)?.title ?? toolId,
      })
      setSystemNotice({
        level: 'task',
        message: SYSTEM_NOTICE_COPY.autoSaved,
        autoDismissMs: 2200,
      })
    },
    [autoSaveEnabled, pocketInventory, saveToolToPocket, setSystemNotice],
  )

  const handleReplySuccess = useCallback(
    async (safeText: string, reply: AgentTurnReply) => {
      setSelectedToolPayload(reply.selectedTool)
      setAgentUiPayload(reply.uiPayload)
      if (reply.selectedTool?.toolId || reply.uiPayload) {
        onCoverRecommendation()
      }
      if (memoryEnabled) {
        saveChatHistory({
          userText: safeText,
          assistantText: reply.text,
          selectedToolId: reply.selectedTool?.toolId,
        })
      }

      const pocketKey = getSelectedGadgetKey()
      const nextPocketGadget = pickModeCardAfterTurn(pocketKey, reply.selectedTool?.toolId)
      onPocketGadgetChange(nextPocketGadget)
      if (reply.selectedTool?.toolId) {
        triggerPocketReveal(nextPocketGadget)
      }

      await maybeAutoSaveTool(safeText, reply)

      setBotResponse(reply.text)
      if (soundEffectsEnabled && reply.text.trim()) {
        void playDoraPocketSfx()
      }

      if (!voicePlaybackEnabled) {
        onRevealRecommendation()
        finishSpeakingTurn()
        return
      }

      if (voicePlaybackMode === 'key-result' && reply.text.trim().length > 120) {
        onRevealRecommendation()
        finishSpeakingTurn()
        return
      }

      const audioUrl = await buildTTSAudioUrl(reply.text)

      if (audioUrl) {
        setAppState('speaking')
        playAudioStream(audioUrl, () => {
          onRevealRecommendation()
          finishSpeakingTurn()
        })
        return
      }

      onRevealRecommendation()
      finishSpeakingTurn()
    },
    [
      finishSpeakingTurn,
      getSelectedGadgetKey,
      memoryEnabled,
      maybeAutoSaveTool,
      onCoverRecommendation,
      onPocketGadgetChange,
      onRevealRecommendation,
      saveChatHistory,
      setAppState,
      setBotResponse,
      soundEffectsEnabled,
      triggerPocketReveal,
      voicePlaybackEnabled,
      voicePlaybackMode,
    ],
  )

  const handleReplyError = useCallback(
    (error: unknown) => {
      stopAudioPlayback()
      setSelectedToolPayload(null)
      setAgentUiPayload(null)
      setBotResponse('')
      setAppState('idle')
      const message = error instanceof Error ? error.message : SYSTEM_NOTICE_COPY.analysisFailed
      setLastSpeechError(message)
      setSystemNotice({ level: 'critical', message, autoDismissMs: 2800 })
    },
    [setAppState, setBotResponse, setLastSpeechError, setSystemNotice],
  )

  const runAgentTurn = useCallback(
    async (text: string, options?: RunTurnOptions) => {
      const safeText = text.trim()
      if (!safeText) return

      try {
        stopAudioPlayback()
        responseBufferRef.current = ''
        setLastSpeechError('')
        setBotResponse('')
        setAppState('thinking')
        latestUserPromptRef.current = safeText
        setCurrentPrompt(safeText)

        const reply = await askQwen(safeText, {
          answerBookFromPocket: options?.answerBookFromPocket === true,
          explanationMode,
          onMeta: handleReplyMeta,
          onDelta: handleReplyDelta,
        })

        await handleReplySuccess(safeText, reply)
      } catch (error) {
        handleReplyError(error)
      }
    },
    [
      explanationMode,
      handleReplyDelta,
      handleReplyError,
      handleReplyMeta,
      handleReplySuccess,
      setAppState,
      setBotResponse,
      setLastSpeechError,
    ],
  )

  const revealNow = useCallback(() => {
    stopAudioPlayback()
    onRevealRecommendation()
    finishSpeakingTurn()
  }, [finishSpeakingTurn, onRevealRecommendation])

  useEffect(() => {
    if (!autoSaveNotice) return
    const id = window.setTimeout(() => setAutoSaveNotice(null), 3200)
    return () => window.clearTimeout(id)
  }, [autoSaveNotice])

  useEffect(() => {
    return () => {
      stopAudioPlayback()
      window.clearTimeout(pocketReachTimerRef.current)
    }
  }, [])

  return {
    selectedToolPayload,
    agentUiPayload,
    currentPrompt,
    autoSaveNotice,
    latestUserPromptRef,
    setAutoSaveNotice,
    clearResponseState,
    runAgentTurn,
    revealNow,
  }
}
