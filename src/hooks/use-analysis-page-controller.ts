'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type SetStateAction,
} from 'react'
import { type AnalysisStage } from '@/components/discovery/analysis-stage-content'
import { useAnalysisSession } from '@/hooks/use-analysis-session'
import { useAppShellState } from '@/hooks/use-app-shell-state'
import { useDiscoveryWorkspaceActions } from '@/hooks/use-discovery-workspace-actions'
import { usePocketGadgetModalActions } from '@/hooks/use-pocket-gadget-modal-actions'
import { useToolDial } from '@/hooks/use-tool-dial'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { useSaveChatHistoryMutation, useChatHistoryQuery } from '@/lib/query/chat-history'
import { useSaveMarketFeedbackMutation } from '@/lib/query/market'
import {
  useMarkToolUsedMutation,
  usePocketInventoryQuery,
  useRemoveToolFromPocketMutation,
  useSaveToolToPocketMutation,
} from '@/lib/query/pocket'
import { useSaveUserSettingsMutation, useUserSettingsQuery } from '@/lib/query/user-settings'
import { MODE_KEY_ANYWHERE_DOOR, type AssistantModeCard } from '@/shared/mode-registry'
import { PAGE_COPY } from '@/shared/ui-copy'
import { useStore } from '@/store'

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
  const systemNotice = useStore((state) => state.systemNotice)
  const selectedGadgetKey = useStore((state) => state.selectedGadgetKey)
  const setAppState = useStore((state) => state.setAppState)
  const setTranscript = useStore((state) => state.setTranscript)
  const setBotResponse = useStore((state) => state.setBotResponse)
  const setLastSpeechError = useStore((state) => state.setLastSpeechError)
  const setSystemNotice = useStore((state) => state.setSystemNotice)
  const clearSystemNotice = useStore((state) => state.clearSystemNotice)
  const setSelectedGadgetKey = useStore((state) => state.setSelectedGadgetKey)

  const { data: pocketInventory = [] } = usePocketInventoryQuery()
  const saveToolToPocketMutation = useSaveToolToPocketMutation()
  const removeToolFromPocketMutation = useRemoveToolFromPocketMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()
  const saveMarketFeedbackMutation = useSaveMarketFeedbackMutation()
  const saveChatHistoryMutation = useSaveChatHistoryMutation()
  const { data: chatHistory = [] } = useChatHistoryQuery()
  const { data: userSettings } = useUserSettingsQuery()
  const saveUserSettingsMutation = useSaveUserSettingsMutation()

  const [inputModeOverride, setInputModeOverride] = useState<InputMode | null>(null)
  const [textFallback, setTextFallback] = useState('')
  const [pocketModalOpen, setPocketModalOpen] = useState(false)
  const [pocketGadget, setPocketGadget] = useState<AssistantModeCard | null>(null)
  const [analysisStage, setAnalysisStage] = useState<AnalysisStage>('idle')
  const analysisStageRef = useRef<AnalysisStage>('idle')
  const stageImmediateTimerRef = useRef<number | null>(null)
  const stageTimerRef = useRef<number | null>(null)
  const revealTimerRef = useRef<number | null>(null)
  const coveredRevealTimerRef = useRef<number | null>(null)
  const autoSaveEnabled = userSettings?.autoSaveToPocketEnabled ?? true
  const {
    toolDialOpen,
    toolDialMode,
    toolDialRef,
    setToolDialMode,
    closeToolDial,
    toggleToolDial,
  } = useToolDial()
  const inputMode = inputModeOverride ?? userSettings?.defaultInputMode ?? 'text'

  const {
    selectedToolPayload,
    agentUiPayload,
    currentPrompt,
    autoSaveNotice,
    latestUserPromptRef,
    setAutoSaveNotice,
    clearResponseState,
    runAgentTurn,
    revealNow,
  } = useAnalysisSession({
    autoSaveEnabled,
    userSettings,
    pocketInventory,
    saveChatHistory: saveChatHistoryMutation.mutate,
    saveToolToPocket: saveToolToPocketMutation.mutateAsync,
    setAppState,
    setTranscript,
    setBotResponse,
    setLastSpeechError,
    setSystemNotice,
    getSelectedGadgetKey: () => useStore.getState().selectedGadgetKey,
    onPocketGadgetChange: setPocketGadget,
    onCoverRecommendation: () => {
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current)
        revealTimerRef.current = null
      }
      if (coveredRevealTimerRef.current) {
        window.clearTimeout(coveredRevealTimerRef.current)
        coveredRevealTimerRef.current = null
      }
      setAnalysisStage('covered')
      coveredRevealTimerRef.current = window.setTimeout(() => {
        if (analysisStageRef.current === 'covered') {
          analysisStageRef.current = 'revealing'
          setAnalysisStage('revealing')
          revealTimerRef.current = window.setTimeout(() => {
            analysisStageRef.current = 'ready'
            setAnalysisStage('ready')
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
      setAnalysisStage('revealing')
      revealTimerRef.current = window.setTimeout(() => {
        setAnalysisStage('ready')
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
    autoSaveNotice,
    getLatestUserPrompt: () => latestUserPromptRef.current,
    saveToolToPocket: saveToolToPocketMutation.mutate,
    removeToolFromPocket: removeToolFromPocketMutation.mutate,
    markToolUsed: markToolUsedMutation.mutate,
    saveMarketFeedback: saveMarketFeedbackMutation.mutate,
    setAutoSaveNotice,
    setSystemNotice,
    enableAutoSave: () => {
      const current = userSettings
      if (!current) return
      saveUserSettingsMutation.mutate({ ...current, autoSaveToPocketEnabled: true })
    },
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
    analysisStageRef.current = analysisStage
  }, [analysisStage])

  useEffect(() => {
    const clearTimers = () => {
      if (stageImmediateTimerRef.current) {
        window.clearTimeout(stageImmediateTimerRef.current)
        stageImmediateTimerRef.current = null
      }
      if (stageTimerRef.current) {
        window.clearTimeout(stageTimerRef.current)
        stageTimerRef.current = null
      }
    }
    const clearRevealTimer = () => {
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current)
        revealTimerRef.current = null
      }
      if (coveredRevealTimerRef.current) {
        window.clearTimeout(coveredRevealTimerRef.current)
        coveredRevealTimerRef.current = null
      }
    }
    const scheduleStage = (stage: AnalysisStage) => {
      stageImmediateTimerRef.current = window.setTimeout(() => {
        setAnalysisStage(stage)
        stageImmediateTimerRef.current = null
      }, 0)
    }

    const hasPrompt = Boolean(currentPrompt?.trim())
    if (!hasPrompt) {
      clearTimers()
      clearRevealTimer()
      scheduleStage('idle')
      return clearTimers
    }

    const currentStage = analysisStageRef.current
    if (currentStage === 'covered' || currentStage === 'revealing' || currentStage === 'ready') {
      return clearTimers
    }

    if (appState === 'thinking') {
      clearTimers()
      scheduleStage('understanding')
      stageTimerRef.current = window.setTimeout(() => {
        setAnalysisStage((current) => (current === 'understanding' ? 'judging' : current))
        stageTimerRef.current = null
      }, 700)
      return clearTimers
    }

    if (appState === 'speaking') {
      return clearTimers
    }

    scheduleStage('understanding')
    return clearTimers
  }, [appState, currentPrompt])

  const handleDraftTask = useCallback((draft: string) => {
    setTextFallback(draft)
  }, [])

  const canSendText = textFallback.trim().length > 0
  const inputLocked =
    appState === 'thinking' ||
    analysisStage === 'judging' ||
    analysisStage === 'covered' ||
    analysisStage === 'revealing'
  const canSkipVoice = appState === 'speaking' && analysisStage === 'covered'
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
    systemNotice,
    selectedGadgetKey,
    pocketModalOpen,
    pocketGadget,
    currentPrompt,
    analysisStage,
    autoSaveEnabled,
    autoSaveNotice,
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
    inputLocked,
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
    setToolDialMode,
    setInputMode,
    setTextFallback,
    submitTextMessage,
    holdToTalkStart,
    holdToTalkEnd,
    revealNow,
  }
}
