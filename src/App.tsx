import { AnalysisInputComposer } from '@/components/analysis-input-composer'
import { AnalysisStagePanel } from '@/components/analysis-stage-panel'
import { PageShell } from '@/components/common/page-shell'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { DiscoveryWorkspace } from '@/components/discovery-workspace'
import { ListeningHud } from '@/components/listening-hud'
import { PocketGadgetModal } from '@/components/pocket-gadget-modal'
import { useAnalysisPageController } from '@/hooks/use-analysis-page-controller'
import { cn } from '@/lib/utils'
import { PAGE_COPY } from '@/shared/ui-copy'

export default function App() {
  const {
    appState,
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
  } = useAnalysisPageController()

  return (
    <PageShell
      className={cn('touch-manipulation', rootCursor)}
      contentClassName="grid min-h-0 grid-cols-1 gap-3 px-3 pb-4 pt-2 sm:px-4 sm:pt-3 lg:h-[calc(100dvh-6.9rem)] lg:grid-cols-[minmax(0,1.45fr)_minmax(21rem,0.72fr)] lg:items-stretch lg:gap-3 lg:overflow-hidden lg:px-4 lg:pb-2 lg:pt-4"
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
      {appState === 'listening' ? <ListeningHud /> : null}
      <div className="min-h-0 h-full">
        <DiscoveryWorkspace
          currentPrompt={currentPrompt}
          appState={appState}
          analysisStage={analysisStage}
          agentPayload={agentUiPayload}
          selectedToolPayload={selectedToolPayload}
          autoSaveEnabled={autoSaveEnabled}
          autoSaveNotice={autoSaveNotice}
          onOpenPocket={workspaceActions.onOpenPocket}
          onSaveCandidate={workspaceActions.onSaveCandidate}
          onLaunchCandidate={workspaceActions.onLaunchCandidate}
          onOpenExternalCandidate={workspaceActions.onOpenExternalCandidate}
          onUndoAutoSave={workspaceActions.onUndoAutoSave}
          onEnableAutoSave={workspaceActions.onEnableAutoSave}
          onFeedback={workspaceActions.onFeedback}
          onDraftTask={handleDraftTask}
        />
      </div>

      <AnalysisStagePanel
        appState={appState}
        analysisStage={analysisStage}
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
        canSkipVoice={canSkipVoice}
        onRevealNow={revealNow}
      >
        <AnalysisInputComposer
          appState={appState}
          inputMode={inputMode}
          textFallback={textFallback}
          canSendText={canSendText}
          locked={inputLocked}
          placeholder={promptPlaceholder}
          onToggleInputMode={() => setInputMode((mode) => (mode === 'text' ? 'voice' : 'text'))}
          onTextChange={setTextFallback}
          onSubmit={() => {
            submitTextMessage(textFallback, () => {
              setTextFallback('')
            })
          }}
          onHoldToTalkStart={holdToTalkStart}
          onHoldToTalkEnd={holdToTalkEnd}
        />
      </AnalysisStagePanel>
    </PageShell>
  )
}
