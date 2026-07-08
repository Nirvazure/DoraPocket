'use client'

import { useCallback, useEffect, useRef } from 'react'
import { playAudioStream, playDoraPocketSfx, stopAudioPlayback } from '@/lib/client/audio'
import { askQwen, type ChatToolPayload } from '@/lib/client/llm'
import { buildTTSAudioUrl } from '@/lib/client/tts'
import type { UserSettings } from '@/shared/user/user-settings'
import { pickModeCardAfterTurn, type AssistantModeCard } from '@/shared/discovery/mode-registry'
import type { AgentUiPayload } from '@/shared/market/market-types'
import { SYSTEM_NOTICE_COPY } from '@/shared/copy/ui-copy'
import type { ClarificationSession } from '@/shared/discovery/clarification-session-types'
import { IDLE_ANALYSIS_FLOW } from '@/app/analyse/_domain/analysis-stage-content'
import { appendClarificationTurn } from '@/shared/discovery/clarification-session'
import {
  resolveAgentTurnRequest,
  resolveVoicePlaybackText,
  type AgentTurnReply,
  type RunTurnOptions,
} from '@/app/analyse/_domain/analysis-session'
import { useStore } from '@/store'

type UseAnalysisSessionOptions = {
  userSettings?: UserSettings
  onPrepareAgentTurn?: () => void
  onPocketGadgetChange: (gadget: AssistantModeCard) => void
  onCoverRecommendation: () => void
  onRevealRecommendation: (force?: boolean) => void
  onAnalysisError?: () => void
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function useAnalysisSession({
  userSettings,
  onPrepareAgentTurn,
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

  const setAppState = useStore((state) => state.setAppState)
  const setTranscript = useStore((state) => state.setTranscript)
  const setBotResponse = useStore((state) => state.setBotResponse)
  const setLastSpeechError = useStore((state) => state.setLastSpeechError)
  const setSystemNotice = useStore((state) => state.setSystemNotice)
  const beginAgentTurn = useStore((state) => state.beginAgentTurn)
  const isAgentTurnActive = useStore((state) => state.isAgentTurnActive)
  const setClarificationSession = useStore((state) => state.setClarificationSession)
  const setCurrentPrompt = useStore((state) => state.setCurrentPrompt)
  const setAnalysisFlow = useStore((state) => state.setAnalysisFlow)
  const setProgressStage = useStore((state) => state.setProgressStage)
  const setSelectedToolPayload = useStore((state) => state.setSelectedToolPayload)
  const setAgentUiPayload = useStore((state) => state.setAgentUiPayload)
  const setRecommendationSessionId = useStore((state) => state.setRecommendationSessionId)
  const resetAgentResponse = useStore((state) => state.resetAgentResponse)

  const selectedToolPayload = useStore((state) => state.selectedToolPayload)
  const agentUiPayload = useStore((state) => state.agentUiPayload)
  const recommendationSessionId = useStore((state) => state.recommendationSessionId)
  const currentPrompt = useStore((state) => state.currentPrompt)
  const clarificationSession = useStore((state) => state.clarificationSession)
  const progressStage = useStore((state) => state.progressStage)

  const voicePlaybackMode = userSettings?.voicePlaybackMode ?? 'key-result'
  const voicePlaybackEnabled =
    userSettings?.voicePlaybackEnabled !== false && voicePlaybackMode !== 'off'
  const soundEffectsEnabled = userSettings?.soundEffectsEnabled !== false
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

  const applyFinalReplyState = useCallback(
    (reply: AgentTurnReply) => {
      setSelectedToolPayload(reply.selectedTool)
      setAgentUiPayload(reply.uiPayload)
      setRecommendationSessionId(reply.recommendationSessionId ?? null)
    },
    [setAgentUiPayload, setRecommendationSessionId, setSelectedToolPayload],
  )

  const presentPocketGadget = useCallback(
    (reply: AgentTurnReply) => {
      const nextPocketGadget = pickModeCardAfterTurn(null, reply.selectedTool?.toolId)
      onPocketGadgetChange(nextPocketGadget)
      if (reply.selectedTool?.toolId) {
        triggerPocketReveal(nextPocketGadget)
      }
    },
    [onPocketGadgetChange, triggerPocketReveal],
  )

  const clearResponseState = useCallback(() => {
    setLastSpeechError('')
    resetAgentResponse()
  }, [resetAgentResponse, setLastSpeechError])

  const releaseStaleTurn = useCallback(
    (turnId: number) => {
      if (isAgentTurnActive(turnId)) return
      const { agentTurnId, appState } = useStore.getState()
      if (agentTurnId > turnId) return
      if (appState === 'thinking' || appState === 'speaking') {
        setAppState('idle')
        setProgressStage(null)
      }
    },
    [isAgentTurnActive, setAppState, setProgressStage],
  )

  const finishReplyPlayback = useCallback(
    async (reply: AgentTurnReply, turnId: number, isActive: () => boolean) => {
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
      if (!isActive()) {
        releaseStaleTurn(turnId)
        return
      }

      if (audioUrl) {
        setAppState('speaking')
        playAudioStream(audioUrl, () => {
          if (!isActive()) {
            releaseStaleTurn(turnId)
            return
          }
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
      onRevealRecommendation,
      releaseStaleTurn,
      setAppState,
      setBotResponse,
      soundEffectsEnabled,
      voicePlaybackEnabled,
      voicePlaybackMode,
    ],
  )

  const handleReplyError = useCallback(
    (error: unknown, turnId: number) => {
      if (!isAgentTurnActive(turnId)) return
      stopAudioPlayback()
      resetAgentResponse()
      setClarificationSession(null)
      setProgressStage(null)
      setAppState('idle')
      onAnalysisError?.()
      const message = error instanceof Error ? error.message : SYSTEM_NOTICE_COPY.analysisFailed
      setLastSpeechError(message)
      setSystemNotice({ level: 'critical', message, autoDismissMs: 2800 })
    },
    [
      isAgentTurnActive,
      onAnalysisError,
      resetAgentResponse,
      setAppState,
      setLastSpeechError,
      setProgressStage,
      setClarificationSession,
      setSystemNotice,
    ],
  )

  const runAgentTurn = useCallback(
    async (text: string, options?: RunTurnOptions) => {
      const priorClarification = useStore.getState().clarificationSession
      const request = resolveAgentTurnRequest({ text, options, priorClarification })
      if (!request) return
      const { safeText, isContinuation, session, requestMessage } = request
      onPrepareAgentTurn?.()
      const { turnId, signal } = beginAgentTurn()
      const isActive = () => isAgentTurnActive(turnId)

      const handleReplyMeta = ({
        selectedTool,
        uiPayload,
      }: {
        selectedTool: ChatToolPayload
        uiPayload: AgentUiPayload | null
      }) => {
        if (!isActive()) return
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
      }

      const handleReplyDelta = (chunk: string) => {
        if (!isActive()) return
        responseBufferRef.current += chunk
        setBotResponse(responseBufferRef.current)
      }

      const handleReplySuccess = async (reply: AgentTurnReply) => {
        if (!isActive()) {
          releaseStaleTurn(turnId)
          return
        }
        applyFinalReplyState(reply)

        if (
          (reply.selectedTool?.toolId || reply.uiPayload) &&
          !recommendationCoverStartedRef.current
        ) {
          recommendationCoverStartedRef.current = true
          onCoverRecommendation()
        }

        presentPocketGadget(reply)
        await finishReplyPlayback(reply, turnId, isActive)
      }

      try {
        stopAudioPlayback()
        responseBufferRef.current = ''
        recommendationCoverStartedRef.current = false
        clarifyQuickRepliesRef.current = []
        skipCoverRef.current =
          isContinuation && priorClarification?.status === 'clarifying' && !options?.skipClarify
        setLastSpeechError('')
        setBotResponse('')
        setAppState('thinking')
        setProgressStage(null)

        if (!isContinuation) {
          latestUserPromptRef.current = session.anchorPrompt
          setCurrentPrompt(options?.displayPrompt?.trim() || session.anchorPrompt)
          setClarificationSession(session)
        }

        const reply = await askQwen(requestMessage, {
          signal,
          sessionTurn: session.turn,
          anchorPrompt: session.anchorPrompt,
          priorMessages: session.messages,
          skipClarify: options?.skipClarify,
          explanationMode,
          onProgress: (stage) => {
            if (!isActive()) return
            setProgressStage(stage)
          },
          onClarify: (payload) => {
            if (!isActive()) return
            skipCoverRef.current = true
            clarifyQuickRepliesRef.current = payload.quickReplies
          },
          onMeta: handleReplyMeta,
          onDelta: handleReplyDelta,
          onRecommendationSession: ({ recommendationSessionId }) => {
            if (!isActive()) return
            setRecommendationSessionId(recommendationSessionId)
          },
        })

        if (!isActive()) {
          releaseStaleTurn(turnId)
          return
        }

        if (reply.clarificationStatus === 'clarifying') {
          const updated: ClarificationSession = {
            ...appendClarificationTurn(session, {
              user: safeText || session.anchorPrompt,
              assistant: reply.text,
            }),
            status: 'clarifying',
            quickReplies: clarifyQuickRepliesRef.current,
          }
          setClarificationSession(updated)
          setProgressStage(null)
          setAppState('idle')
          setBotResponse(reply.text)
          return
        }

        setClarificationSession(null)
        setProgressStage(null)
        skipCoverRef.current = false
        await handleReplySuccess(reply)
      } catch (error) {
        if (isAbortError(error)) {
          releaseStaleTurn(turnId)
          return
        }
        handleReplyError(error, turnId)
      }
    },
    [
      applyFinalReplyState,
      beginAgentTurn,
      explanationMode,
      finishReplyPlayback,
      handleReplyError,
      isAgentTurnActive,
      onPrepareAgentTurn,
      onCoverRecommendation,
      presentPocketGadget,
      setAgentUiPayload,
      setAppState,
      setBotResponse,
      setCurrentPrompt,
      setLastSpeechError,
      setProgressStage,
      setRecommendationSessionId,
      setSelectedToolPayload,
      setClarificationSession,
      releaseStaleTurn,
    ],
  )

  const toggleDialogueExpanded = useCallback(() => {
    setClarificationSession((session) =>
      session ? { ...session, dialogueExpanded: !session.dialogueExpanded } : null,
    )
  }, [setClarificationSession])

  const revealNow = useCallback(() => {
    stopAudioPlayback()
    onRevealRecommendation(true)
    finishSpeakingTurn()
  }, [finishSpeakingTurn, onRevealRecommendation])

  const cancelActiveAgentTurn = useStore((state) => state.cancelActiveAgentTurn)

  const resetAnalysisForNewTask = useCallback(() => {
    stopAudioPlayback()
    cancelActiveAgentTurn()
    setLastSpeechError('')
    setBotResponse('')
    setTranscript('')
    setCurrentPrompt(null)
    setClarificationSession(null)
    setProgressStage(null)
    setRecommendationSessionId(null)
    resetAgentResponse()
    setAnalysisFlow(IDLE_ANALYSIS_FLOW)
    setAppState('idle')
    latestUserPromptRef.current = ''
    responseBufferRef.current = ''
    recommendationCoverStartedRef.current = false
    skipCoverRef.current = false
    clarifyQuickRepliesRef.current = []
  }, [
    cancelActiveAgentTurn,
    resetAgentResponse,
    setAnalysisFlow,
    setAppState,
    setBotResponse,
    setCurrentPrompt,
    setLastSpeechError,
    setProgressStage,
    setRecommendationSessionId,
    setClarificationSession,
    setTranscript,
  ])

  useEffect(() => {
    return () => {
      stopAudioPlayback()
      window.clearTimeout(pocketReachTimerRef.current)
    }
  }, [])

  return {
    selectedToolPayload,
    agentUiPayload,
    recommendationSessionId,
    currentPrompt,
    clarificationSession,
    progressStage,
    latestUserPromptRef,
    clearResponseState,
    resetAnalysisForNewTask,
    runAgentTurn,
    revealNow,
    toggleDialogueExpanded,
  }
}
