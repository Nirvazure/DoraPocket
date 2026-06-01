'use client'

import { AnalysisBottomBar } from '@/components/analysis-bottom-bar'
import { AnalysisStagePanel } from '@/components/analysis-stage-panel'
import { PageShell } from '@/components/common/page-shell'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { DiscoveryWorkspace } from '@/components/discovery-workspace'
import { ListeningHud } from '@/components/listening-hud'
import { PocketGadgetModal } from '@/components/pocket-gadget-modal'
import { PocketQuickSettingsModal } from '@/components/pocket/pocket-quick-settings-modal'
import { useAnalysisPageController } from '@/hooks/use-analysis-page-controller'
import { usePrefersCompactStage } from '@/hooks/use-prefers-compact-stage'
import { stopAudioPlayback } from '@/lib/client/audio'
import { PAGE_COPY } from '@/shared/ui-copy'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  resolveCurrentStep,
  resolveMaxVisibleStep,
} from '@/components/discovery/analysis-stage-content'

export default function App() {
  const {
    appState,
    systemNotice,
    botResponse,
    selectedGadgetKey,
    pocketModalOpen,
    quickSettingsOpen,
    pocketGadget,
    userSettings,
    settingsReadOnly,
    currentPrompt,
    progressStage,
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
    workspaceActions,
    pocketGadgetModalActions,
    handleDraftTask,
    toggleToolDial,
    handleSelectDialGadget,
    setPocketModalOpen,
    setQuickSettingsOpen,
    saveUserSettings,
    setToolDialMode,
    setInputMode,
    setTextFallback,
    submitTextMessage,
    holdToTalkStart,
    holdToTalkEnd,
    cancelVoiceInput,
    revealNow,
    step2Session,
    skipToRecommendation,
    toggleDialogueExpanded,
    handleQuickReply,
  } = useAnalysisPageController()

  const workspaceRef = useRef<HTMLElement>(null)
  const prefersCompactStage = usePrefersCompactStage()
  const [mobileStageExpanded, setMobileStageExpanded] = useState(false)

  const hasPrompt = Boolean(currentPrompt?.trim())
  const hasResult = Boolean(agentUiPayload || selectedToolPayload?.toolId)
  const recommendationStep = useMemo(
    () => resolveCurrentStep(analysisFlow, hasPrompt, hasResult),
    [analysisFlow, hasPrompt, hasResult],
  )
  const maxVisibleStep = useMemo(
    () => resolveMaxVisibleStep(analysisFlow, hasPrompt, hasResult),
    [analysisFlow, hasPrompt, hasResult],
  )
  const showMobileCompactStage =
    prefersCompactStage && recommendationStep === 3 && maxVisibleStep >= 3

  const handleReachRecommendationStep = useCallback(() => {
    if (prefersCompactStage) {
      setMobileStageExpanded(false)
    }
  }, [prefersCompactStage])

  return (
    <PageShell
      className={rootCursor}
      contentMaxWidthClassName="max-w-[min(100%,120rem)]"
      contentClassName="flex min-h-0 flex-col gap-3 px-3 pb-4 pt-2 sm:px-4 sm:pt-3 lg:h-[calc(100dvh-6.9rem)] lg:overflow-hidden lg:px-4 lg:pb-2 lg:pt-4"
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
      <PocketQuickSettingsModal
        open={quickSettingsOpen}
        settings={userSettings}
        readOnly={settingsReadOnly}
        onClose={() => setQuickSettingsOpen(false)}
        onSave={saveUserSettings}
      />
      {appState === 'listening' ? <ListeningHud /> : null}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(21rem,0.72fr)] lg:items-stretch">
        <div className="discovery-panel-lg-type flex h-full min-h-0 flex-col">
          <DiscoveryWorkspace
            ref={workspaceRef}
            currentPrompt={currentPrompt}
            appState={appState}
            analysisFlow={analysisFlow}
            progressStage={progressStage}
            agentPayload={agentUiPayload}
            selectedToolPayload={selectedToolPayload}
            explanationMode={userSettings?.explanationMode ?? 'standard'}
            onSaveCandidate={workspaceActions.onSaveCandidate}
            onLaunchCandidate={workspaceActions.onLaunchCandidate}
            onOpenExternalCandidate={workspaceActions.onOpenExternalCandidate}
            onDraftTask={handleDraftTask}
            onReachRecommendationStep={handleReachRecommendationStep}
            scrollOnReachRecommendation={prefersCompactStage}
          />
        </div>

        <div className="flex h-full min-h-0 flex-col">
          <AnalysisStagePanel
            appState={appState}
            analysisFlow={analysisFlow}
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
            onOpenQuickSettings={() => setQuickSettingsOpen(true)}
            mobileCompact={showMobileCompactStage}
            mobileCompactExpanded={mobileStageExpanded}
            onToggleMobileCompact={() => setMobileStageExpanded((value) => !value)}
          >
            <AnalysisBottomBar
              analysisFlow={analysisFlow}
              appState={appState}
              botResponse={botResponse}
              step2Session={step2Session}
              showSkip={
                step2Session != null &&
                step2Session.turn < (userSettings?.explanationMode === 'brief' ? 2 : 3)
              }
              canSkipVoice={canSkipVoice}
              inputMode={inputMode}
              textFallback={textFallback}
              canSendText={canSendText}
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
              onCancelVoiceInput={cancelVoiceInput}
              onStopVoicePlayback={stopAudioPlayback}
              onRevealNow={revealNow}
              onQuickReply={handleQuickReply}
              onSkipRecommendation={skipToRecommendation}
              onToggleDialogueExpanded={toggleDialogueExpanded}
            />
          </AnalysisStagePanel>
        </div>
      </div>
    </PageShell>
  )
}
