'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type SetStateAction,
} from 'react'
import {
  IDLE_ANALYSIS_FLOW,
  shouldPreserveTurnFlow,
  type AnalysisFlow,
} from '@/app/analyse/_domain/analysis-stage-content'
import { useAnalysisFlowReveal } from '@/app/analyse/_hooks/use-analysis-flow-reveal'
import { useAnalysisToolLookup } from '@/app/analyse/_hooks/use-analysis-tool-lookup'
import { useAnalysisSession } from '@/app/analyse/_hooks/use-analysis-session'
import { useAutoDismissSystemNotice } from '@/app/analyse/_hooks/use-auto-dismiss-system-notice'
import { useDiscoveryWorkspaceActions } from '@/app/analyse/_hooks/use-discovery-workspace-actions'
import { usePocketGadgetModalActions } from '@/app/analyse/_hooks/use-pocket-gadget-modal-actions'
import { useVoiceInput } from '@/app/analyse/_hooks/use-voice-input'
import { useAuthSessionQuery, resolveSettingsReadOnly } from '@/lib/query/auth-session'
import { useMarkToolUsedMutation, useSaveToolToPocketMutation } from '@/lib/query/pocket'
import { useSaveUserSettingsMutation, useUserSettingsQuery } from '@/lib/query/user-settings'
import type { AssistantModeCard } from '@/shared/discovery/mode-registry'
import { PAGE_COPY, SYSTEM_NOTICE_COPY } from '@/shared/copy/ui-copy'
import { mergeClarificationIntoAnalysisFlow, useStore } from '@/store'
import { shouldRestartAnalysisFlow } from '@/app/analyse/_domain/analysis-stage-restart'
import type { DiscoveryWorkspaceHandle } from '@/app/analyse/_components/discovery/discovery-workspace'

type InputMode = 'text' | 'voice'

type UseAnalysisPageControllerOptions = {
  workspaceRef?: RefObject<DiscoveryWorkspaceHandle | null>
}

export function useAnalysisPageController(options: UseAnalysisPageControllerOptions = {}) {
  const { workspaceRef } = options
  const appState = useStore((state) => state.appState)
  const transcript = useStore((state) => state.transcript)
  const botResponse = useStore((state) => state.botResponse)
  const systemNotice = useStore((state) => state.systemNotice)
  const analysisFlow = useStore((state) => state.analysisFlow)
  const clarificationSession = useStore((state) => state.clarificationSession)
  const setSystemNotice = useStore((state) => state.setSystemNotice)
  const clearSystemNotice = useStore((state) => state.clearSystemNotice)
  const setAnalysisFlow = useStore((state) => state.setAnalysisFlow)
  const setAppState = useStore((state) => state.setAppState)

  const saveToolToPocketMutation = useSaveToolToPocketMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()
  const { data: userSettings } = useUserSettingsQuery()
  const { data: authSession, isPending: authPending } = useAuthSessionQuery()
  const saveUserSettingsMutation = useSaveUserSettingsMutation()
  const isAuthenticated = authSession?.authenticated === true
  const settingsReadOnly = resolveSettingsReadOnly(authPending, authSession?.authenticated)

  const [inputModeOverride, setInputModeOverride] = useState<InputMode | null>(null)
  const [textFallback, setTextFallback] = useState('')
  const [pocketModalOpen, setPocketModalOpen] = useState(false)
  const [pocketGadget, setPocketGadget] = useState<AssistantModeCard | null>(null)
  const previousPromptRef = useRef<string | null>(null)
  const stageImmediateTimerRef = useRef<number | null>(null)
  const controllerMountedRef = useRef(false)
  const {
    analysisFlowRef,
    bindAnalysisFlowRef,
    clearRevealTimers,
    startCoverRecommendation,
    requestRevealRecommendation,
    prepareNewAgentTurn,
    resetAnalysisFlowAfterError,
    workingFlow,
  } = useAnalysisFlowReveal(setAnalysisFlow)
  const inputMode = inputModeOverride ?? userSettings?.defaultInputMode ?? 'text'

  const {
    selectedToolPayload,
    agentUiPayload,
    recommendationSessionId,
    currentPrompt,
    latestUserPromptRef,
    clearResponseState,
    resetAnalysisForNewTask,
    resetRecommendationForReview,
    runAgentTurn,
    revealNow,
    toggleDialogueExpanded,
  } = useAnalysisSession({
    userSettings,
    onPrepareAgentTurn: prepareNewAgentTurn,
    onPocketGadgetChange: setPocketGadget,
    onAnalysisError: resetAnalysisFlowAfterError,
    onCoverRecommendation: startCoverRecommendation,
    onRevealRecommendation: requestRevealRecommendation,
  })

  const runAgentTurnForVoice = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      if (!currentPrompt?.trim()) {
        await workspaceRef?.current?.applyNaturalDescription(trimmed)
        setAppState('idle')
        return
      }
      await runAgentTurn(trimmed, { isContinuation: true })
    },
    [currentPrompt, runAgentTurn, setAppState, workspaceRef],
  )

  const { holdToTalkStart, holdToTalkEnd, cancelVoiceInput, submitTextMessage } = useVoiceInput({
    appState,
    runAgentTurn: runAgentTurnForVoice,
    clearResponseState,
  })

  const getTool = useAnalysisToolLookup(agentUiPayload, selectedToolPayload)

  const saveToolToPocket = useCallback(
    (input: { toolId: string; sourceQuestion?: string; presetArgs?: Record<string, unknown> }) => {
      saveToolToPocketMutation.mutate(input, {
        onSuccess: () => {
          setSystemNotice({
            level: 'task',
            message: SYSTEM_NOTICE_COPY.savedForLater,
            autoDismissMs: 2200,
          })
        },
        onError: () => {
          setSystemNotice({
            level: 'critical',
            message: '收藏失败，请稍后再试。',
            autoDismissMs: 2200,
          })
        },
      })
    },
    [saveToolToPocketMutation, setSystemNotice],
  )

  const workspaceActions = useDiscoveryWorkspaceActions({
    authPending,
    isAuthenticated,
    getTool,
    getLatestUserPrompt: () => latestUserPromptRef.current,
    saveToolToPocket,
    markToolUsed: markToolUsedMutation.mutate,
    setSystemNotice,
    getRecommendationSessionId: () => useStore.getState().recommendationSessionId,
  })

  const pocketGadgetModalActions = usePocketGadgetModalActions({
    authPending,
    isAuthenticated,
    getTool,
    selectedToolPayload,
    getLatestUserPrompt: () => latestUserPromptRef.current,
    saveToolToPocket,
    markToolUsed: markToolUsedMutation.mutate,
  })

  useLayoutEffect(() => {
    if (!userSettings?.fontPreset) return
    document.documentElement.dataset.fontPreset = userSettings.fontPreset
  }, [userSettings?.fontPreset])

  useAutoDismissSystemNotice({ systemNotice, clearSystemNotice })

  const resolvedAnalysisFlow = useMemo(
    () => mergeClarificationIntoAnalysisFlow(analysisFlow, clarificationSession),
    [analysisFlow, clarificationSession],
  )

  useEffect(() => {
    bindAnalysisFlowRef(resolvedAnalysisFlow)
  }, [bindAnalysisFlowRef, resolvedAnalysisFlow])

  useEffect(() => {
    controllerMountedRef.current = true
    return () => {
      controllerMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const clearTimers = () => {
      if (stageImmediateTimerRef.current) {
        window.clearTimeout(stageImmediateTimerRef.current)
        stageImmediateTimerRef.current = null
      }
    }
    const runAfterMount = (fn: () => void) => {
      stageImmediateTimerRef.current = window.setTimeout(() => {
        stageImmediateTimerRef.current = null
        if (!controllerMountedRef.current) return
        fn()
      }, 0)
    }
    const scheduleFlow = (flow: AnalysisFlow) => {
      runAfterMount(() => {
        analysisFlowRef.current = flow
        setAnalysisFlow(flow)
      })
    }

    const hasPrompt = Boolean(currentPrompt?.trim())
    const normalizedPrompt = currentPrompt?.trim() ?? null
    const previousPrompt = previousPromptRef.current
    previousPromptRef.current = normalizedPrompt
    if (!hasPrompt) {
      clearTimers()
      clearRevealTimers()
      scheduleFlow(IDLE_ANALYSIS_FLOW)
      return clearTimers
    }

    const currentFlow = analysisFlowRef.current
    const restartingForNewPrompt = shouldRestartAnalysisFlow({
      previousPrompt,
      nextPrompt: normalizedPrompt,
      currentFlow,
      anchorPrompt: clarificationSession?.anchorPrompt,
    })
    if (!restartingForNewPrompt && shouldPreserveTurnFlow(currentFlow)) {
      return clearTimers
    }

    if (appState === 'thinking') {
      clearTimers()
      if (shouldPreserveTurnFlow(analysisFlowRef.current)) {
        return clearTimers
      }
      scheduleFlow(workingFlow)
      return clearTimers
    }

    if (appState === 'speaking') {
      return clearTimers
    }

    return clearTimers
  }, [
    analysisFlowRef,
    appState,
    clearRevealTimers,
    currentPrompt,
    setAnalysisFlow,
    clarificationSession,
    workingFlow,
  ])

  const handleStartStructuredAnalysis = useCallback(
    async (prompt: string, displayPrompt: string) => {
      if (appState !== 'idle') return
      setTextFallback('')
      await runAgentTurn(prompt, { displayPrompt })
    },
    [appState, runAgentTurn],
  )

  const handleStartNewTask = useCallback(() => {
    resetAnalysisForNewTask()
    setTextFallback('')
    clearRevealTimers()
    setAnalysisFlow(IDLE_ANALYSIS_FLOW)
  }, [clearRevealTimers, resetAnalysisForNewTask, setAnalysisFlow])

  const handleReturnToUnderstanding = useCallback(() => {
    resetRecommendationForReview()
    setTextFallback('')
    clearRevealTimers()
    setAnalysisFlow(IDLE_ANALYSIS_FLOW)
  }, [clearRevealTimers, resetRecommendationForReview, setAnalysisFlow])

  const handleQuickReply = useCallback(
    (text: string) => {
      void runAgentTurn(text, { isContinuation: true })
    },
    [runAgentTurn],
  )

  const canSendText = textFallback.trim().length > 0
  const canSkipVoice = appState === 'speaking' && resolvedAnalysisFlow.beat === 'cover'
  const promptPlaceholder = PAGE_COPY.analysis.promptPlaceholder
  const setInputMode = useCallback(
    (next: SetStateAction<InputMode>) => {
      setInputModeOverride((current) => {
        const resolvedCurrent = current ?? userSettings?.defaultInputMode ?? 'text'
        return typeof next === 'function' ? next(resolvedCurrent) : next
      })
    },
    [userSettings?.defaultInputMode],
  )

  const saveUserSettings = useCallback(
    (next: Parameters<typeof saveUserSettingsMutation.mutate>[0]) => {
      if (authPending || !isAuthenticated) return
      saveUserSettingsMutation.mutate(next)
    },
    [authPending, isAuthenticated, saveUserSettingsMutation],
  )

  return {
    appState,
    transcript,
    botResponse,
    systemNotice,
    pocketModalOpen,
    pocketGadget,
    userSettings,
    isAuthenticated,
    settingsReadOnly,
    currentPrompt,
    clarificationSession,
    analysisFlow: resolvedAnalysisFlow,
    selectedToolPayload,
    agentUiPayload,
    recommendationSessionId,
    getTool,
    inputMode,
    textFallback,
    canSendText,
    canSkipVoice,
    promptPlaceholder,
    workspaceActions,
    pocketGadgetModalActions,
    handleStartStructuredAnalysis,
    handleStartNewTask,
    handleReturnToUnderstanding,
    starterActionsEnabled: !currentPrompt?.trim() && appState === 'idle',
    setPocketModalOpen,
    saveUserSettings,
    setInputMode,
    setTextFallback,
    submitTextMessage,
    holdToTalkStart,
    holdToTalkEnd,
    cancelVoiceInput,
    revealNow,
    toggleDialogueExpanded,
    handleQuickReply,
  }
}
