'use client'

import { useCallback, useEffect, useRef } from 'react'
import { playAudioStream, playDoraPocketSfx, stopAudioPlayback } from '@/lib/client/audio'
import { askQwen, type ChatToolPayload } from '@/lib/client/llm'
import { buildTTSAudioUrl } from '@/lib/client/tts'
import type { UserSettings, VoicePlaybackMode } from '@/shared/user-settings'
import { pickModeCardAfterTurn, type AssistantModeCard } from '@/shared/mode-registry'
import type { AgentUiPayload } from '@/shared/market-types'
import { SYSTEM_NOTICE_COPY } from '@/shared/ui-copy'
import type { Step2Session } from '@/shared/step2-session-types'
import { IDLE_ANALYSIS_FLOW } from '@/shared/analysis-stage-content'
import { appendStep2Turn, createStep2Session } from '@/shared/step2-session'
import { useStore } from '@/store'

type RunTurnOptions = {
  skipClarify?: boolean
  isContinuation?: boolean
  displayPrompt?: string
}

type UseAnalysisSessionOptions = {
  userSettings?: UserSettings
  onPrepareAgentTurn?: () => void
  onPocketGadgetChange: (gadget: AssistantModeCard) => void
  onCoverRecommendation: () => void
  onRevealRecommendation: (force?: boolean) => void
  onAnalysisError?: () => void
}

type AgentTurnReply = {
  text: string
  selectedTool: ChatToolPayload
  uiPayload: AgentUiPayload | null
  recommendationSessionId?: string | null
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
  const setStep2Session = useStore((state) => state.setStep2Session)
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
  const step2Session = useStore((state) => state.step2Session)
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

  const handleReplyError = useCallback(
    (error: unknown, turnId: number) => {
      if (!isAgentTurnActive(turnId)) return
      stopAudioPlayback()
      resetAgentResponse()
      setStep2Session(null)
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
      setStep2Session,
      setSystemNotice,
    ],
  )

  const runAgentTurn = useCallback(
    async (text: string, options?: RunTurnOptions) => {
      const safeText = text.trim()
      if (!safeText && !options?.skipClarify) return

      const priorStep2 = useStore.getState().step2Session
      const isContinuation = priorStep2?.status === 'clarifying' || options?.isContinuation === true
      const session =
        isContinuation && priorStep2
          ? priorStep2
          : createStep2Session(safeText || priorStep2?.anchorPrompt || '')

      const requestMessage = isContinuation ? safeText || '跳过' : session.anchorPrompt
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
        setSelectedToolPayload(reply.selectedTool)
        setAgentUiPayload(reply.uiPayload)
        setRecommendationSessionId(reply.recommendationSessionId ?? null)
        if (
          (reply.selectedTool?.toolId || reply.uiPayload) &&
          !recommendationCoverStartedRef.current
        ) {
          recommendationCoverStartedRef.current = true
          onCoverRecommendation()
        }

        const nextPocketGadget = pickModeCardAfterTurn(null, reply.selectedTool?.toolId)
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
      }

      try {
        stopAudioPlayback()
        responseBufferRef.current = ''
        recommendationCoverStartedRef.current = false
        clarifyQuickRepliesRef.current = []
        skipCoverRef.current =
          isContinuation && priorStep2?.status === 'clarifying' && !options?.skipClarify
        setLastSpeechError('')
        setBotResponse('')
        setAppState('thinking')
        setProgressStage(null)

        if (!isContinuation) {
          latestUserPromptRef.current = session.anchorPrompt
          setCurrentPrompt(options?.displayPrompt?.trim() || session.anchorPrompt)
          setStep2Session(session)
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
      beginAgentTurn,
      explanationMode,
      finishSpeakingTurn,
      handleReplyError,
      isAgentTurnActive,
      onPrepareAgentTurn,
      onCoverRecommendation,
      releaseStaleTurn,
      onPocketGadgetChange,
      onRevealRecommendation,
      setAgentUiPayload,
      setAppState,
      setBotResponse,
      setCurrentPrompt,
      setLastSpeechError,
      setProgressStage,
      setRecommendationSessionId,
      setSelectedToolPayload,
      setStep2Session,
      soundEffectsEnabled,
      triggerPocketReveal,
      voicePlaybackEnabled,
      voicePlaybackMode,
    ],
  )

  const toggleDialogueExpanded = useCallback(() => {
    setStep2Session((session) =>
      session ? { ...session, dialogueExpanded: !session.dialogueExpanded } : null,
    )
  }, [setStep2Session])

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
    setStep2Session(null)
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
    setStep2Session,
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
    step2Session,
    progressStage,
    latestUserPromptRef,
    clearResponseState,
    resetAnalysisForNewTask,
    runAgentTurn,
    revealNow,
    toggleDialogueExpanded,
  }
}
