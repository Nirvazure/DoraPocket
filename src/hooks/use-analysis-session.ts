'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { playAudioStream, playDoraPocketSfx, stopAudioPlayback } from '@/lib/client/audio'
import { askQwen, type ChatToolPayload } from '@/lib/client/llm'
import { buildTTSAudioUrl } from '@/lib/client/tts'
import type { UserSettings, VoicePlaybackMode } from '@/shared/user-settings'
import { pickModeCardAfterTurn, type AssistantModeCard } from '@/shared/mode-registry'
import type { AgentUiPayload } from '@/shared/market-types'
import { SYSTEM_NOTICE_COPY } from '@/shared/ui-copy'
import type { ProgressStage, Step2Session } from '@/shared/step2-session-types'
import { appendStep2Turn, createStep2Session } from '@/shared/step2-session'
import type { AppState } from '@/store'

type RunTurnOptions = {
  answerBookFromPocket?: boolean
  skipClarify?: boolean
  isContinuation?: boolean
}

type UseAnalysisSessionOptions = {
  userSettings?: UserSettings
  saveChatHistory: (input: {
    userText: string
    assistantText: string
    selectedToolId?: string
  }) => void
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
  onAnalysisError?: () => void
}

type AgentTurnReply = {
  text: string
  selectedTool: ChatToolPayload
  uiPayload: AgentUiPayload | null
}

const KEY_RESULT_MAX_CHARS = 120

function resolveVoicePlaybackText(reply: AgentTurnReply, mode: VoicePlaybackMode): string {
  if (mode === 'full') {
    return reply.text.trim()
  }

  const selectionReason = reply.uiPayload?.selectionReason?.trim()
  if (selectionReason) {
    return selectionReason.length <= KEY_RESULT_MAX_CHARS
      ? selectionReason
      : `${selectionReason.slice(0, KEY_RESULT_MAX_CHARS)}…`
  }

  const text = reply.text.trim()
  if (!text) return ''

  const firstSentence = text.match(/^[^。！？\n]+[。！？]?/u)?.[0]?.trim() ?? text
  if (firstSentence.length <= KEY_RESULT_MAX_CHARS) {
    return firstSentence
  }

  return `${firstSentence.slice(0, KEY_RESULT_MAX_CHARS)}…`
}

export function useAnalysisSession({
  userSettings,
  saveChatHistory,
  setAppState,
  setTranscript,
  setBotResponse,
  setLastSpeechError,
  setSystemNotice,
  getSelectedGadgetKey,
  onPocketGadgetChange,
  onCoverRecommendation,
  onRevealRecommendation,
  onAnalysisError,
}: UseAnalysisSessionOptions) {
  const pocketReachTimerRef = useRef(0)
  const latestUserPromptRef = useRef('')
  const responseBufferRef = useRef('')
  const recommendationCoverStartedRef = useRef(false)
  const skipCoverRef = useRef(false)
  const clarifyQuickRepliesRef = useRef<string[]>([])
  const [selectedToolPayload, setSelectedToolPayload] = useState<ChatToolPayload>(null)
  const [agentUiPayload, setAgentUiPayload] = useState<AgentUiPayload | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null)
  const [step2Session, setStep2Session] = useState<Step2Session | null>(null)
  const [progressStage, setProgressStage] = useState<ProgressStage | null>(null)
  const voicePlaybackMode = userSettings?.voicePlaybackMode ?? 'key-result'
  const voicePlaybackEnabled =
    userSettings?.voicePlaybackEnabled !== false && voicePlaybackMode !== 'off'
  const soundEffectsEnabled = userSettings?.soundEffectsEnabled !== false
  const memoryEnabled = userSettings?.memoryEnabled !== false
  const builtinToolsEnabled = userSettings?.builtinToolsEnabled === true
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
      if (
        skipCoverRef.current ||
        !((selectedTool?.toolId || uiPayload) && !recommendationCoverStartedRef.current)
      ) {
        return
      }
      recommendationCoverStartedRef.current = true
      onCoverRecommendation()
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

  const handleReplySuccess = useCallback(
    async (safeText: string, reply: AgentTurnReply) => {
      setSelectedToolPayload(reply.selectedTool)
      setAgentUiPayload(reply.uiPayload)
      if (
        (reply.selectedTool?.toolId || reply.uiPayload) &&
        !recommendationCoverStartedRef.current
      ) {
        recommendationCoverStartedRef.current = true
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

      setBotResponse(reply.text)
      if (soundEffectsEnabled && reply.text.trim()) {
        void playDoraPocketSfx()
      }

      if (!voicePlaybackEnabled) {
        onRevealRecommendation()
        finishSpeakingTurn()
        return
      }

      const speechText = resolveVoicePlaybackText(reply, voicePlaybackMode)
      if (!speechText) {
        onRevealRecommendation()
        finishSpeakingTurn()
        return
      }

      const audioUrl = await buildTTSAudioUrl(speechText)

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
      setStep2Session(null)
      setProgressStage(null)
      setAppState('idle')
      onAnalysisError?.()
      const message = error instanceof Error ? error.message : SYSTEM_NOTICE_COPY.analysisFailed
      setLastSpeechError(message)
      setSystemNotice({ level: 'critical', message, autoDismissMs: 2800 })
    },
    [onAnalysisError, setAppState, setBotResponse, setLastSpeechError, setSystemNotice],
  )

  const runAgentTurn = useCallback(
    async (text: string, options?: RunTurnOptions) => {
      const safeText = text.trim()
      if (!safeText && !options?.skipClarify) return

      const isContinuation =
        step2Session?.status === 'clarifying' || options?.isContinuation === true
      const session =
        isContinuation && step2Session
          ? step2Session
          : createStep2Session(safeText || step2Session?.anchorPrompt || '')

      const requestMessage = isContinuation ? safeText || '跳过' : session.anchorPrompt

      try {
        stopAudioPlayback()
        responseBufferRef.current = ''
        recommendationCoverStartedRef.current = false
        clarifyQuickRepliesRef.current = []
        skipCoverRef.current =
          isContinuation && step2Session?.status === 'clarifying' && !options?.skipClarify
        setLastSpeechError('')
        setBotResponse('')
        setAppState('thinking')
        setProgressStage(null)

        if (!isContinuation) {
          latestUserPromptRef.current = session.anchorPrompt
          setCurrentPrompt(session.anchorPrompt)
          setStep2Session(session)
        }

        const reply = await askQwen(requestMessage, {
          sessionTurn: session.turn,
          anchorPrompt: session.anchorPrompt,
          priorMessages: session.messages,
          skipClarify: options?.skipClarify,
          answerBookFromPocket: options?.answerBookFromPocket === true,
          explanationMode,
          builtinToolsEnabled,
          onProgress: setProgressStage,
          onClarify: (payload) => {
            skipCoverRef.current = true
            clarifyQuickRepliesRef.current = payload.quickReplies
          },
          onMeta: handleReplyMeta,
          onDelta: handleReplyDelta,
        })

        if (reply.step2Status === 'clarifying') {
          const updated: Step2Session = {
            ...appendStep2Turn(session, {
              user: safeText || session.anchorPrompt,
              assistant: reply.text,
            }),
            status: 'clarifying',
            quickReplies: clarifyQuickRepliesRef.current,
          }
          setStep2Session(updated)
          setProgressStage(null)
          setAppState('idle')
          setBotResponse(reply.text)
          return
        }

        setStep2Session(null)
        setProgressStage(null)
        skipCoverRef.current = false
        await handleReplySuccess(session.anchorPrompt, reply)
      } catch (error) {
        handleReplyError(error)
      }
    },
    [
      builtinToolsEnabled,
      explanationMode,
      handleReplyDelta,
      handleReplyError,
      handleReplyMeta,
      handleReplySuccess,
      setAppState,
      setBotResponse,
      setLastSpeechError,
      step2Session,
    ],
  )

  const skipToRecommendation = useCallback(() => {
    if (!step2Session) return
    void runAgentTurn(step2Session.anchorPrompt, {
      skipClarify: true,
      isContinuation: true,
    })
  }, [runAgentTurn, step2Session])

  const toggleDialogueExpanded = useCallback(() => {
    setStep2Session((session) =>
      session ? { ...session, dialogueExpanded: !session.dialogueExpanded } : null,
    )
  }, [])

  const revealNow = useCallback(() => {
    stopAudioPlayback()
    onRevealRecommendation()
    finishSpeakingTurn()
  }, [finishSpeakingTurn, onRevealRecommendation])

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
    step2Session,
    progressStage,
    latestUserPromptRef,
    clearResponseState,
    runAgentTurn,
    revealNow,
    skipToRecommendation,
    toggleDialogueExpanded,
  }
}
