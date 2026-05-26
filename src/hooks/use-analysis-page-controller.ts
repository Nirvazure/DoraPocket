'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type SetStateAction,
} from 'react'
import {
  IDLE_ANALYSIS_FLOW,
  resolveAnalysisFlowAfterError,
  shouldPreserveTurnFlow,
  type AnalysisFlow,
} from '@/components/discovery/analysis-stage-content'
import { useAnalysisSession } from '@/hooks/use-analysis-session'
import { useAppShellState } from '@/hooks/use-app-shell-state'
import { useDiscoveryWorkspaceActions } from '@/hooks/use-discovery-workspace-actions'
import { usePocketGadgetModalActions } from '@/hooks/use-pocket-gadget-modal-actions'
import { useToolDial } from '@/hooks/use-tool-dial'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { useSaveChatHistoryMutation, useChatHistoryQuery } from '@/lib/query/chat-history'
import { useSaveMarketFeedbackMutation } from '@/lib/query/market'
import { useMarkToolUsedMutation, useSaveToolToPocketMutation } from '@/lib/query/pocket'
import { useSaveUserSettingsMutation, useUserSettingsQuery } from '@/lib/query/user-settings'
import { MODE_KEY_ANYWHERE_DOOR, type AssistantModeCard } from '@/shared/mode-registry'
import { PAGE_COPY } from '@/shared/ui-copy'
import { useStore } from '@/store'
import { shouldRestartAnalysisFlow } from '@/hooks/analysis-stage-restart'

type InputMode = 'text' | 'voice'

function formatHistoryTime(value: number) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function useAnalysisPageController() {
  const appState = useStore((state) => state.appState)
  const transcript = useStore((state) => state.transcript)
  const botResponse = useStore((state) => state.botResponse)
  const systemNotice = useStore((state) => state.systemNotice)
  const selectedGadgetKey = useStore((state) => state.selectedGadgetKey)
  const setAppState = useStore((state) => state.setAppState)
  const setTranscript = useStore((state) => state.setTranscript)
  const setBotResponse = useStore((state) => state.setBotResponse)
  const setLastSpeechError = useStore((state) => state.setLastSpeechError)
  const setSystemNotice = useStore((state) => state.setSystemNotice)
  const clearSystemNotice = useStore((state) => state.clearSystemNotice)
  const setSelectedGadgetKey = useStore((state) => state.setSelectedGadgetKey)

  const saveToolToPocketMutation = useSaveToolToPocketMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()
  const saveMarketFeedbackMutation = useSaveMarketFeedbackMutation()
  const saveChatHistoryMutation = useSaveChatHistoryMutation()
  const { data: chatHistory = [] } = useChatHistoryQuery()
  const { data: userSettings } = useUserSettingsQuery()
  const saveUserSettingsMutation = useSaveUserSettingsMutation()

  const [inputModeOverride, setInputModeOverride] = useState<InputMode | null>(null)
  const [textFallback, setTextFallback] = useState('')
  const [pocketModalOpen, setPocketModalOpen] = useState(false)
  const [quickSettingsOpen, setQuickSettingsOpen] = useState(false)
  const [pocketGadget, setPocketGadget] = useState<AssistantModeCard | null>(null)
  const [analysisFlow, setAnalysisFlow] = useState<AnalysisFlow>(IDLE_ANALYSIS_FLOW)
  const analysisFlowRef = useRef<AnalysisFlow>(IDLE_ANALYSIS_FLOW)
  const previousPromptRef = useRef<string | null>(null)
  const stageImmediateTimerRef = useRef<number | null>(null)
  const revealTimerRef = useRef<number | null>(null)
  const coveredRevealTimerRef = useRef<number | null>(null)
  const {
    toolDialOpen,
    toolDialMode,
    toolDialRef,
    setToolDialMode,
    closeToolDial,
    toggleToolDial,
  } = useToolDial()
  const inputMode = inputModeOverride ?? userSettings?.defaultInputMode ?? 'text'

  const clearRevealTimers = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current)
      revealTimerRef.current = null
    }
    if (coveredRevealTimerRef.current) {
      window.clearTimeout(coveredRevealTimerRef.current)
      coveredRevealTimerRef.current = null
    }
  }, [])

  const resetAnalysisFlowAfterError = useCallback(() => {
    clearRevealTimers()
    const nextFlow = resolveAnalysisFlowAfterError()
    analysisFlowRef.current = nextFlow
    setAnalysisFlow(nextFlow)
  }, [clearRevealTimers])

  const {
    selectedToolPayload,
    agentUiPayload,
    currentPrompt,
    latestUserPromptRef,
    clearResponseState,
    runAgentTurn,
    revealNow,
  } = useAnalysisSession({
    userSettings,
    saveChatHistory: saveChatHistoryMutation.mutate,
    setAppState,
    setTranscript,
    setBotResponse,
    setLastSpeechError,
    setSystemNotice,
    getSelectedGadgetKey: () => useStore.getState().selectedGadgetKey,
    onPocketGadgetChange: setPocketGadget,
    onAnalysisError: resetAnalysisFlowAfterError,
    onCoverRecommendation: () => {
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current)
        revealTimerRef.current = null
      }
      if (coveredRevealTimerRef.current) {
        window.clearTimeout(coveredRevealTimerRef.current)
        coveredRevealTimerRef.current = null
      }
      const coverFlow: AnalysisFlow = { phase: 'analyzing', beat: 'cover' }
      analysisFlowRef.current = coverFlow
      setAnalysisFlow(coverFlow)
      coveredRevealTimerRef.current = window.setTimeout(() => {
        if (
          analysisFlowRef.current.phase === 'analyzing' &&
          analysisFlowRef.current.beat === 'cover'
        ) {
          const revealFlow: AnalysisFlow = { phase: 'analyzing', beat: 'reveal' }
          analysisFlowRef.current = revealFlow
          setAnalysisFlow(revealFlow)
          revealTimerRef.current = window.setTimeout(() => {
            const revealedFlow: AnalysisFlow = { phase: 'revealed', beat: 'working' }
            analysisFlowRef.current = revealedFlow
            setAnalysisFlow(revealedFlow)
            revealTimerRef.current = null
          }, 420)
        }
        coveredRevealTimerRef.current = null
      }, 2600)
    },
    onRevealRecommendation: () => {
      if (coveredRevealTimerRef.current) {
        window.clearTimeout(coveredRevealTimerRef.current)
        coveredRevealTimerRef.current = null
      }
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current)
        revealTimerRef.current = null
      }
      const revealFlow: AnalysisFlow = { phase: 'analyzing', beat: 'reveal' }
      analysisFlowRef.current = revealFlow
      setAnalysisFlow(revealFlow)
      revealTimerRef.current = window.setTimeout(() => {
        const revealedFlow: AnalysisFlow = { phase: 'revealed', beat: 'working' }
        analysisFlowRef.current = revealedFlow
        setAnalysisFlow(revealedFlow)
        revealTimerRef.current = null
      }, 420)
    },
  })

  const { holdToTalkStart, holdToTalkEnd, submitTextMessage } = useVoiceInput({
    appState,
    runAgentTurn,
    setAppState,
    setTranscript,
    setBotResponse,
    setLastSpeechError,
    setSystemNotice,
    clearResponseState,
  })

  const workspaceActions = useDiscoveryWorkspaceActions({
    getLatestUserPrompt: () => latestUserPromptRef.current,
    saveToolToPocket: saveToolToPocketMutation.mutate,
    markToolUsed: markToolUsedMutation.mutate,
    saveMarketFeedback: saveMarketFeedbackMutation.mutate,
    setSystemNotice,
  })

  const pocketGadgetModalActions = usePocketGadgetModalActions({
    selectedToolPayload,
    getLatestUserPrompt: () => latestUserPromptRef.current,
    saveToolToPocket: saveToolToPocketMutation.mutate,
    markToolUsed: markToolUsedMutation.mutate,
  })

  const { rootCursor, dialGadgets, handleSelectDialGadget } = useAppShellState({
    appState,
    selectedToolPayload,
    toolDialMode,
    setPocketGadget,
    setPocketModalOpen,
    closeToolDial,
    setSelectedGadgetKey,
  })

  useLayoutEffect(() => {
    if (!userSettings?.fontPreset) return
    document.documentElement.dataset.fontPreset = userSettings.fontPreset
  }, [userSettings?.fontPreset])

  useEffect(() => {
    if (selectedGadgetKey == null) {
      setSelectedGadgetKey(MODE_KEY_ANYWHERE_DOOR)
    }
  }, [selectedGadgetKey, setSelectedGadgetKey])

  useEffect(() => {
    if (!systemNotice?.autoDismissMs) return
    const id = window.setTimeout(() => clearSystemNotice(), systemNotice.autoDismissMs)
    return () => window.clearTimeout(id)
  }, [clearSystemNotice, systemNotice])

  useEffect(() => {
    analysisFlowRef.current = analysisFlow
  }, [analysisFlow])

  useEffect(() => {
    const clearTimers = () => {
      if (stageImmediateTimerRef.current) {
        window.clearTimeout(stageImmediateTimerRef.current)
        stageImmediateTimerRef.current = null
      }
    }
    const clearRevealTimer = () => {
      clearRevealTimers()
    }
    const scheduleFlow = (flow: AnalysisFlow) => {
      stageImmediateTimerRef.current = window.setTimeout(() => {
        analysisFlowRef.current = flow
        setAnalysisFlow(flow)
        stageImmediateTimerRef.current = null
      }, 0)
    }

    const hasPrompt = Boolean(currentPrompt?.trim())
    const normalizedPrompt = currentPrompt?.trim() ?? null
    const previousPrompt = previousPromptRef.current
    previousPromptRef.current = normalizedPrompt
    if (!hasPrompt) {
      clearTimers()
      clearRevealTimer()
      scheduleFlow(IDLE_ANALYSIS_FLOW)
      return clearTimers
    }

    const currentFlow = analysisFlowRef.current
    const restartingForNewPrompt = shouldRestartAnalysisFlow({
      previousPrompt,
      nextPrompt: normalizedPrompt,
      currentFlow,
    })
    if (!restartingForNewPrompt && shouldPreserveTurnFlow(currentFlow)) {
      return clearTimers
    }

    if (appState === 'thinking') {
      clearTimers()
      scheduleFlow({ phase: 'analyzing', beat: 'working' })
      return clearTimers
    }

    if (appState === 'speaking') {
      return clearTimers
    }

    return clearTimers
  }, [appState, clearRevealTimers, currentPrompt])

  const handleDraftTask = useCallback((draft: string) => {
    setTextFallback(draft)
  }, [])

  const canSendText = textFallback.trim().length > 0
  const canSkipVoice = appState === 'speaking' && analysisFlow.beat === 'cover'
  const promptPlaceholder = PAGE_COPY.analysis.promptPlaceholder
  const conversationHistory = chatHistory.slice(0, 6)
  const setInputMode = useCallback(
    (next: SetStateAction<InputMode>) => {
      setInputModeOverride((current) => {
        const resolvedCurrent = current ?? userSettings?.defaultInputMode ?? 'text'
        return typeof next === 'function' ? next(resolvedCurrent) : next
      })
    },
    [userSettings?.defaultInputMode],
  )

  return {
    appState,
    transcript,
    botResponse,
    systemNotice,
    selectedGadgetKey,
    pocketModalOpen,
    quickSettingsOpen,
    pocketGadget,
    userSettings,
    currentPrompt,
    analysisFlow,
    selectedToolPayload,
    agentUiPayload,
    rootCursor,
    toolDialRef,
    toolDialOpen,
    toolDialMode,
    dialGadgets,
    inputMode,
    textFallback,
    canSendText,
    canSkipVoice,
    promptPlaceholder,
    conversationHistory,
    formatHistoryTime,
    workspaceActions,
    pocketGadgetModalActions,
    handleDraftTask,
    toggleToolDial,
    handleSelectDialGadget,
    setPocketModalOpen,
    setQuickSettingsOpen,
    saveUserSettings: saveUserSettingsMutation.mutate,
    setToolDialMode,
    setInputMode,
    setTextFallback,
    submitTextMessage,
    holdToTalkStart,
    holdToTalkEnd,
    revealNow,
  }
}
