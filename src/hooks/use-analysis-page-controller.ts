'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useAnalysisSession } from '@/hooks/use-analysis-session'
import { useAppShellState } from '@/hooks/use-app-shell-state'
import { useAutoSavePreference } from '@/hooks/use-auto-save-preference'
import { useDiscoveryWorkspaceActions } from '@/hooks/use-discovery-workspace-actions'
import { usePocketGadgetModalActions } from '@/hooks/use-pocket-gadget-modal-actions'
import { useToolDial } from '@/hooks/use-tool-dial'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { useSaveChatHistoryMutation } from '@/lib/query/chat-history'
import { useSaveMarketFeedbackMutation } from '@/lib/query/market'
import {
  useMarkToolUsedMutation,
  usePocketInventoryQuery,
  useRemoveToolFromPocketMutation,
  useSaveToolToPocketMutation,
} from '@/lib/query/pocket'
import { MODE_KEY_ANYWHERE_DOOR, type AssistantModeCard } from '@/shared/mode-registry'
import { PAGE_COPY } from '@/shared/ui-copy'
import { useStore } from '@/store'

const AUTO_SAVE_POCKET_STORAGE_KEY = 'dp-pocket-autosave-enabled-v1'
const FONT_PRESET_STORAGE_KEY = 'dorapocket-font-preset'

function readFontPreset() {
  try {
    return localStorage.getItem(FONT_PRESET_STORAGE_KEY) ?? 'c'
  } catch {
    return 'c'
  }
}

type InputMode = 'text' | 'voice'

export function useAnalysisPageController() {
  // 页面级共享状态：分析页本身依赖的 UI / 会话状态仍挂在 store 中。
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

  // 页面装配用的 query / mutation：主流程只依赖这里暴露的 mutate 接口。
  const { data: pocketInventory = [] } = usePocketInventoryQuery()
  const saveToolToPocketMutation = useSaveToolToPocketMutation()
  const removeToolFromPocketMutation = useRemoveToolFromPocketMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()
  const saveMarketFeedbackMutation = useSaveMarketFeedbackMutation()
  const saveChatHistoryMutation = useSaveChatHistoryMutation()

  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [textFallback, setTextFallback] = useState('')
  const [pocketModalOpen, setPocketModalOpen] = useState(false)
  const [pocketGadget, setPocketGadget] = useState<AssistantModeCard | null>(null)
  const [starterDraftReady, setStarterDraftReady] = useState(false)
  const { autoSaveEnabled, enableAutoSave } = useAutoSavePreference(AUTO_SAVE_POCKET_STORAGE_KEY)
  const {
    toolDialOpen,
    toolDialMode,
    toolDialRef,
    setToolDialMode,
    closeToolDial,
    toggleToolDial,
  } = useToolDial()

  // 分析会话主链路：统一处理问答、推荐、自动沉淀与语音播报。
  const {
    selectedToolPayload,
    agentUiPayload,
    currentPrompt,
    autoSaveNotice,
    latestUserPromptRef,
    setAutoSaveNotice,
    clearResponseState,
    runAgentTurn,
  } = useAnalysisSession({
    autoSaveEnabled,
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
  })

  // 语音和文本输入最终都会汇入 runAgentTurn，保证主流程只有一套提交入口。
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

  // 工作区动作层只负责把页面交互翻译成 query / session 调用。
  const workspaceActions = useDiscoveryWorkspaceActions({
    autoSaveNotice,
    getLatestUserPrompt: () => latestUserPromptRef.current,
    saveToolToPocket: saveToolToPocketMutation.mutate,
    removeToolFromPocket: removeToolFromPocketMutation.mutate,
    markToolUsed: markToolUsedMutation.mutate,
    saveMarketFeedback: saveMarketFeedbackMutation.mutate,
    setAutoSaveNotice,
    setSystemNotice,
    enableAutoSave,
  })

  const pocketGadgetModalActions = usePocketGadgetModalActions({
    selectedToolPayload,
    getLatestUserPrompt: () => latestUserPromptRef.current,
    saveToolToPocket: saveToolToPocketMutation.mutate,
    markToolUsed: markToolUsedMutation.mutate,
  })

  // 页面壳层、快捷拨盘和 Gadget 交互统一由 shell state 管理。
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
    document.documentElement.dataset.fontPreset = readFontPreset()
  }, [])

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

  const handleDraftTask = useCallback((draft: string) => {
    setTextFallback(draft)
    setStarterDraftReady(Boolean(draft.trim()))
  }, [])

  const canSendText = textFallback.trim().length > 0
  const promptPlaceholder = PAGE_COPY.analysis.promptPlaceholder

  return {
    appState,
    transcript,
    systemNotice,
    selectedGadgetKey,
    pocketModalOpen,
    pocketGadget,
    currentPrompt,
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
    starterDraftReady,
    canSendText,
    promptPlaceholder,
    workspaceActions,
    pocketGadgetModalActions,
    handleDraftTask,
    toggleToolDial,
    handleSelectDialGadget,
    setPocketModalOpen,
    setToolDialMode,
    setInputMode,
    setTextFallback,
    setStarterDraftReady,
    submitTextMessage,
    holdToTalkStart,
    holdToTalkEnd,
  }
}
