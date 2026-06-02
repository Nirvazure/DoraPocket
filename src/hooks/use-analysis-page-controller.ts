'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from 'react'
import {
  IDLE_ANALYSIS_FLOW,
  shouldPreserveTurnFlow,
  type AnalysisFlow,
} from '@/components/discovery/analysis-stage-content'
import { useAnalysisFlowReveal } from '@/hooks/analysis-flow-reveal'
import { useAnalysisToolLookup } from '@/hooks/use-analysis-tool-lookup'
import { useAnalysisSession } from '@/hooks/use-analysis-session'
import { useDiscoveryWorkspaceActions } from '@/hooks/use-discovery-workspace-actions'
import { usePocketGadgetModalActions } from '@/hooks/use-pocket-gadget-modal-actions'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { useAuthSessionQuery, resolveSettingsReadOnly } from '@/lib/query/auth-session'
import { useMarkToolUsedMutation, useSaveToolToPocketMutation } from '@/lib/query/pocket'
import { useSaveUserSettingsMutation, useUserSettingsQuery } from '@/lib/query/user-settings'
import type { AssistantModeCard } from '@/shared/mode-registry'
import { PAGE_COPY, SYSTEM_NOTICE_COPY } from '@/shared/ui-copy'
import { mergeStep2IntoAnalysisFlow, useStore } from '@/store'
import { shouldRestartAnalysisFlow } from '@/hooks/analysis-stage-restart'

type InputMode = 'text' | 'voice'

export function useAnalysisPageController() {
  const appState = useStore((state) => state.appState)
  const transcript = useStore((state) => state.transcript)
  const botResponse = useStore((state) => state.botResponse)
  const systemNotice = useStore((state) => state.systemNotice)
  const analysisFlow = useStore((state) => state.analysisFlow)
  const step2Session = useStore((state) => state.step2Session)
  const setAppState = useStore((state) => state.setAppState)
  const setTranscript = useStore((state) => state.setTranscript)
  const setBotResponse = useStore((state) => state.setBotResponse)
  const setLastSpeechError = useStore((state) => state.setLastSpeechError)
  const setSystemNotice = useStore((state) => state.setSystemNotice)
  const clearSystemNotice = useStore((state) => state.clearSystemNotice)
  const setAnalysisFlow = useStore((state) => state.setAnalysisFlow)

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
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false)
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
    currentPrompt,
    progressStage,
    latestUserPromptRef,
    clearResponseState,
    runAgentTurn,
    revealNow,
    skipToRecommendation,
    toggleDialogueExpanded,
  } = useAnalysisSession({
    userSettings,
    onPrepareAgentTurn: prepareNewAgentTurn,
    onPocketGadgetChange: setPocketGadget,
    onAnalysisError: resetAnalysisFlowAfterError,
    onCoverRecommendation: startCoverRecommendation,
    onRevealRecommendation: requestRevealRecommendation,
  })

  const { holdToTalkStart, holdToTalkEnd, cancelVoiceInput, submitTextMessage } = useVoiceInput({
    appState,
    runAgentTurn,
    setAppState,
    setTranscript,
    setBotResponse,
    setLastSpeechError,
    setSystemNotice,
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

  useEffect(() => {
    if (!systemNotice?.autoDismissMs) return
    const id = window.setTimeout(() => clearSystemNotice(), systemNotice.autoDismissMs)
    return () => window.clearTimeout(id)
  }, [clearSystemNotice, systemNotice])

  const resolvedAnalysisFlow = useMemo(
    () => mergeStep2IntoAnalysisFlow(analysisFlow, step2Session),
    [analysisFlow, step2Session],
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
      anchorPrompt: step2Session?.anchorPrompt,
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
  }, [appState, clearRevealTimers, currentPrompt, setAnalysisFlow, step2Session, workingFlow])

  const handleDraftTask = useCallback((draft: string) => {
    setTextFallback(draft)
  }, [])

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
    quickSettingsOpen,
    pocketGadget,
    userSettings,
    isAuthenticated,
    settingsReadOnly,
    currentPrompt,
    step2Session,
    progressStage,
    analysisFlow: resolvedAnalysisFlow,
    selectedToolPayload,
    agentUiPayload,
    getTool,
    inputMode,
    textFallback,
    canSendText,
    canSkipVoice,
    promptPlaceholder,
    workspaceActions,
    pocketGadgetModalActions,
    handleDraftTask,
    setPocketModalOpen,
    setQuickSettingsOpen,
    saveUserSettings,
    setInputMode,
    setTextFallback,
    submitTextMessage,
    holdToTalkStart,
    holdToTalkEnd,
    cancelVoiceInput,
    revealNow,
    skipToRecommendation,
    toggleDialogueExpanded,
    handleQuickReply,
  }
}
