import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { AnalysisInputComposer } from '@/components/analysis-input-composer'
import { AnalysisStagePanel } from '@/components/analysis-stage-panel'
import { ListeningHud } from './components/listening-hud'
import { TranscriptBarrage } from './components/transcript-barrage'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { useStore } from './store'
import {
  MODE_KEY_ANYWHERE_DOOR,
  ASSISTANT_MODES,
  getModeByToolId,
  type AssistantModeCard,
} from '@/shared/mode-registry'
import { PocketGadgetModal } from './components/pocket-gadget-modal'
import { cn } from '@/lib/utils'
import { DiscoveryWorkspace } from '@/components/discovery-workspace'
import {
  useSaveMarketFeedbackMutation,
} from '@/lib/query/market'
import {
  useMarkToolUsedMutation,
  usePocketInventoryQuery,
  useRemoveToolFromPocketMutation,
  useSaveToolToPocketMutation,
} from '@/lib/query/pocket'
import { useSaveChatHistoryMutation } from '@/lib/query/chat-history'
import { useAnalysisSession } from '@/hooks/use-analysis-session'
import { useAutoSavePreference } from '@/hooks/use-auto-save-preference'
import { useDiscoveryWorkspaceActions } from '@/hooks/use-discovery-workspace-actions'
import { usePocketGadgetModalActions } from '@/hooks/use-pocket-gadget-modal-actions'
import { useToolDial } from '@/hooks/use-tool-dial'
import { useVoiceInput } from '@/hooks/use-voice-input'

type InputMode = 'text' | 'voice'

const AUTO_SAVE_POCKET_STORAGE_KEY = 'dp-pocket-autosave-enabled-v1'
const FONT_PRESET_STORAGE_KEY = 'dorapocket-font-preset'
const PROMPT_SUGGESTIONS = [
  '帮我找一个最好用的 PDF 压缩工具',
  '推荐适合查资料并带引用的 AI 搜索工具',
  '我想做 GitHub 主页 README，给我靠谱工具',
]

export default function App() {
  const {
    appState,
    setAppState,
    transcript,
    setTranscript,
    setBotResponse,
    setLastSpeechError,
    systemNotice,
    setSystemNotice,
    clearSystemNotice,
    selectedGadgetKey,
    setSelectedGadgetKey,
  } = useStore()
  const { data: pocketInventory = [] } = usePocketInventoryQuery()
  const saveToolToPocketMutation = useSaveToolToPocketMutation()
  const removeToolFromPocketMutation = useRemoveToolFromPocketMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()
  const saveMarketFeedbackMutation = useSaveMarketFeedbackMutation()
  const saveChatHistoryMutation = useSaveChatHistoryMutation()

  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [textFallback, setTextFallback] = useState('')
  const busyHint = ''
  const [pocketModalOpen, setPocketModalOpen] = useState(false)
  const [pocketGadget, setPocketGadget] = useState<AssistantModeCard | null>(null)
  const { autoSaveEnabled, enableAutoSave } = useAutoSavePreference(
    AUTO_SAVE_POCKET_STORAGE_KEY,
  )
  const {
    toolDialOpen,
    toolDialMode,
    toolDialRef,
    setToolDialMode,
    closeToolDial,
    toggleToolDial,
  } = useToolDial()
  const [starterDraftReady, setStarterDraftReady] = useState(false)

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
    enableAutoSave,
  })
  const pocketGadgetModalActions = usePocketGadgetModalActions({
    selectedToolPayload,
    getLatestUserPrompt: () => latestUserPromptRef.current,
    saveToolToPocket: saveToolToPocketMutation.mutate,
    markToolUsed: markToolUsedMutation.mutate,
  })

  useLayoutEffect(() => {
    document.documentElement.dataset.fontPreset = 'c'
    try {
      localStorage.setItem(FONT_PRESET_STORAGE_KEY, 'c')
    } catch {
      /* ignore */
    }
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

  const rootCursor =
    appState === 'thinking' || appState === 'speaking' ? 'cursor-wait' : 'cursor-default'

  const canSendText = textFallback.trim().length > 0
  const toolBasedGadget = getModeByToolId(selectedToolPayload?.toolId)
  const quickDialGadgets = toolBasedGadget
    ? [toolBasedGadget, ...ASSISTANT_MODES].slice(0, 4)
    : ASSISTANT_MODES.slice(0, 4)
  const dialGadgets = toolDialMode === 'quick' ? quickDialGadgets : ASSISTANT_MODES
  const randomPromptPlaceholder = `试试：${PROMPT_SUGGESTIONS[0]}`
  const handleSelectDialGadget = (gadget: AssistantModeCard) => {
    if (!gadget.selectKey && gadget.toolId) {
      setPocketGadget(gadget)
      setPocketModalOpen(true)
      closeToolDial()
      return
    }
    setSelectedGadgetKey(gadget.selectKey ?? null)
    closeToolDial()
  }

  return (
    <PageShell
      className={cn('touch-manipulation', rootCursor)}
      contentClassName="grid min-h-0 grid-cols-1 gap-4 pb-6 lg:h-[calc(100dvh-6.9rem)] lg:grid-cols-[minmax(0,1.45fr)_minmax(21rem,0.72fr)] lg:items-stretch lg:overflow-hidden lg:pb-3"
      header={
        <UnifiedTopBar
          title="DoraPocket · 分析页"
          subtitle="不只是聊天，而是替你找全网最好用的工具，并把高价值能力沉淀进口袋。"
          statusSlot={
            systemNotice ? (
              <span className="rounded-full border border-border/60 bg-white px-3 py-1 text-[11px] font-semibold text-foreground/75">
                {systemNotice.message}
              </span>
            ) : null
          }
          rightSlot={
            <div className="flex items-center gap-2">
              <TopNavSwitch current="analysis" />
              <ProfileEntryPill />
            </div>
          }
        />
      }
    >
      <PocketGadgetModal
        open={pocketModalOpen}
        gadget={pocketGadget}
        onClose={() => setPocketModalOpen(false)}
        onOpenTool={pocketGadgetModalActions.onOpenTool}
        onSaveToPocket={pocketGadgetModalActions.onSaveToPocket}
      />
      {transcript.trim() ? <TranscriptBarrage text={transcript} /> : null}
      {appState === 'listening' ? <ListeningHud /> : null}
      <div className="min-h-0 h-full">
        <DiscoveryWorkspace
          currentPrompt={currentPrompt}
          appState={appState}
          agentPayload={agentUiPayload}
          selectedToolPayload={selectedToolPayload}
          busyHint={busyHint}
          autoSaveEnabled={autoSaveEnabled}
          autoSaveNotice={autoSaveNotice}
          onOpenPocket={workspaceActions.onOpenPocket}
          onSaveCandidate={workspaceActions.onSaveCandidate}
          onLaunchCandidate={workspaceActions.onLaunchCandidate}
          onUndoAutoSave={workspaceActions.onUndoAutoSave}
          onEnableAutoSave={workspaceActions.onEnableAutoSave}
          onFeedback={workspaceActions.onFeedback}
          onDraftTask={handleDraftTask}
        />
      </div>

      <AnalysisStagePanel
        appState={appState}
        toolDialRef={toolDialRef}
        toolDialOpen={toolDialOpen}
        toolDialMode={toolDialMode}
        selectedGadgetKey={selectedGadgetKey}
        dialGadgets={dialGadgets}
        onToggleToolDial={toggleToolDial}
        onSelectDialGadget={handleSelectDialGadget}
        onToggleToolDialMode={() =>
          setToolDialMode((value) => (value === 'quick' ? 'all' : 'quick'))
        }
      >
        <AnalysisInputComposer
          appState={appState}
          inputMode={inputMode}
          textFallback={textFallback}
          starterDraftReady={starterDraftReady}
          canSendText={canSendText}
          placeholder={randomPromptPlaceholder}
          onToggleInputMode={() => setInputMode((mode) => (mode === 'text' ? 'voice' : 'text'))}
          onTextChange={(value) => {
            setTextFallback(value)
            if (!value.trim()) setStarterDraftReady(false)
          }}
          onSubmit={() => {
            submitTextMessage(textFallback, () => {
              setTextFallback('')
              setStarterDraftReady(false)
            })
          }}
          onDismissDraft={() => setStarterDraftReady(false)}
          onHoldToTalkStart={holdToTalkStart}
          onHoldToTalkEnd={holdToTalkEnd}
        />
      </AnalysisStagePanel>
    </PageShell>
  )
}
