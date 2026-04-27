import { AnalysisInputComposer } from '@/components/analysis-input-composer'
import { AnalysisStagePanel } from '@/components/analysis-stage-panel'
import { PageShell } from '@/components/common/page-shell'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { DiscoveryWorkspace } from '@/components/discovery-workspace'
import { ListeningHud } from '@/components/listening-hud'
import { PocketGadgetModal } from '@/components/pocket-gadget-modal'
import { TranscriptBarrage } from '@/components/transcript-barrage'
import { useAnalysisPageController } from '@/hooks/use-analysis-page-controller'
import { cn } from '@/lib/utils'
import { PAGE_COPY } from '@/shared/ui-copy'

export default function App() {
  const {
    appState, //应用状态
    transcript, //转录文本
    systemNotice, //系统通知
    selectedGadgetKey, //选中的工具键
    pocketModalOpen, //口袋模态是否打开
    pocketGadget, //口袋
    currentPrompt,  //当前输入
    autoSaveEnabled, //自动保存
    autoSaveNotice, //自动保存通知
    selectedToolPayload, //当前选中的工具
    agentUiPayload, //agent的ui数据
    rootCursor, //根光标
    toolDialRef, //工具拨盘的ref
    toolDialOpen, //工具拨盘是否打开
    toolDialMode, //工具拨盘模式
    dialGadgets, //工具拨盘的工具
    inputMode, //输入模式
    textFallback, //文本回退
    starterDraftReady, //是否准备好开始草稿
    canSendText, //是否可以发送文本
    promptPlaceholder, //提示词占位符
    workspaceActions, //工作空间动作
    pocketGadgetModalActions, //口袋工具模态动作
    handleDraftTask, //处理草稿任务     
    toggleToolDial, //切换工具拨盘
    handleSelectDialGadget, //选择工具拨盘工具  
    setPocketModalOpen, //设置口袋模态是否打开
    setToolDialMode, //设置工具拨盘模式
    setInputMode, //设置输入模式
    setTextFallback, //设置文本回退
    setStarterDraftReady, //设置是否准备好开始草稿
    submitTextMessage, //提交文本消息
    holdToTalkStart, //开始长按说话
    holdToTalkEnd, //结束长按说话
  } = useAnalysisPageController() //分析页控制器

  return (
    <PageShell
      className={cn('touch-manipulation', rootCursor)}
      contentClassName="grid min-h-0 grid-cols-1 gap-4 pb-6 lg:h-[calc(100dvh-6.9rem)] lg:grid-cols-[minmax(0,1.45fr)_minmax(21rem,0.72fr)] lg:items-stretch lg:overflow-hidden lg:pb-3"
      header={
        <UnifiedTopBar
          title={PAGE_COPY.analysis.title}
          subtitle={PAGE_COPY.analysis.subtitle}
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
          placeholder={promptPlaceholder}
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
