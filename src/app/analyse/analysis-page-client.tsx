'use client'

import { AnalysisStagePanel } from '@/app/analyse/_components/stage/analysis-stage-panel'
import { LoginEntryButton } from '@/components/auth/login-entry-button'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import {
  DiscoveryWorkspace,
  type DiscoveryWorkspaceHandle,
} from '@/app/analyse/_components/discovery/discovery-workspace'
import { ListeningHud } from '@/app/analyse/_components/listening-hud'
import { PocketGadgetModal } from '@/app/analyse/_components/pocket-gadget-modal'
import { useAnalysisPageController } from '@/app/analyse/_hooks/use-analysis-page-controller'
import { usePrefersCompactStage } from '@/app/analyse/_hooks/use-prefers-compact-stage'
import { stopAudioPlayback } from '@/lib/client/audio'
import {
  resolveCurrentStep,
  resolveMaxVisibleStep,
} from '@/app/analyse/_domain/analysis-stage-content'
import { PAGE_COPY } from '@/shared/copy/ui-copy'
import { useCallback, useMemo, useRef, useState } from 'react'

export function AnalysisPageClient() {
  const workspaceRef = useRef<DiscoveryWorkspaceHandle>(null)
  const {
    appState,
    systemNotice,
    botResponse,
    pocketModalOpen,
    pocketGadget,
    userSettings,
    currentPrompt,
    analysisFlow,
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
    handleOpenRandomDoor,
    randomDoorPending,
    handleStartNewTask,
    handleReturnToUnderstanding,
    starterActionsEnabled,
    setPocketModalOpen,
    setInputMode,
    setTextFallback,
    submitTextMessage,
    holdToTalkStart,
    holdToTalkEnd,
    cancelVoiceInput,
    revealNow,
    clarificationSession,
    toggleDialogueExpanded,
    handleQuickReply,
  } = useAnalysisPageController({ workspaceRef })

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

  const sessionDock = useMemo(
    () => ({
      analysisFlow,
      appState,
      botResponse,
      clarificationSession,
      canSkipVoice,
      inputMode,
      textFallback,
      canSendText,
      placeholder: promptPlaceholder,
      onToggleInputMode: () => setInputMode((mode) => (mode === 'text' ? 'voice' : 'text')),
      onTextChange: setTextFallback,
      onSubmit: () => {
        submitTextMessage(textFallback, () => {
          setTextFallback('')
        })
      },
      onHoldToTalkStart: holdToTalkStart,
      onHoldToTalkEnd: holdToTalkEnd,
      onCancelVoiceInput: cancelVoiceInput,
      onStopVoicePlayback: stopAudioPlayback,
      onRevealNow: revealNow,
      onQuickReply: handleQuickReply,
      onToggleDialogueExpanded: toggleDialogueExpanded,
    }),
    [
      analysisFlow,
      appState,
      botResponse,
      canSendText,
      canSkipVoice,
      cancelVoiceInput,
      handleQuickReply,
      holdToTalkEnd,
      holdToTalkStart,
      inputMode,
      promptPlaceholder,
      revealNow,
      setInputMode,
      setTextFallback,
      submitTextMessage,
      clarificationSession,
      textFallback,
      toggleDialogueExpanded,
    ],
  )

  const voiceFabDisabled = appState === 'thinking' || appState === 'speaking'

  return (
    <PageShell
      className="cursor-default"
      contentClassName="flex min-h-0 flex-col gap-3 pb-4 pt-2 sm:pt-3 lg:h-[calc(100dvh-6.9rem)] lg:overflow-hidden lg:pb-2 lg:pt-4"
      header={
        <UnifiedTopBar
          title={PAGE_COPY.analysis.title}
          subtitle={PAGE_COPY.analysis.subtitle}
          statusSlot={
            systemNotice ? <span className="dp-top-bar-status">{systemNotice.message}</span> : null
          }
          rightSlot={
            <div className="flex items-center gap-2">
              <TopNavSwitch current="analysis" />
              <LoginEntryButton />
            </div>
          }
        />
      }
    >
      <PocketGadgetModal
        open={pocketModalOpen}
        gadget={pocketGadget}
        canOpenExternal={pocketGadget?.toolId != null && getTool(pocketGadget.toolId)?.url != null}
        onClose={() => setPocketModalOpen(false)}
        onOpenTool={pocketGadgetModalActions.onOpenTool}
        onSaveToPocket={pocketGadgetModalActions.onSaveToPocket}
      />
      {appState === 'listening' ? <ListeningHud /> : null}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.52fr)_minmax(18rem,0.62fr)] lg:items-stretch">
        <div className="discovery-panel-lg-type flex h-full min-h-0 flex-col lg:text-[17px] lg:leading-relaxed">
          <DiscoveryWorkspace
            ref={workspaceRef}
            currentPrompt={currentPrompt}
            analysisFlow={analysisFlow}
            agentPayload={agentUiPayload}
            selectedToolPayload={selectedToolPayload}
            getTool={getTool}
            explanationMode={userSettings?.explanationMode ?? 'standard'}
            onSaveCandidate={workspaceActions.onSaveCandidate}
            onLaunchCandidate={workspaceActions.onLaunchCandidate}
            onOpenExternalCandidate={workspaceActions.onOpenExternalCandidate}
            recommendationSessionId={recommendationSessionId}
            onStartAnalysis={handleStartStructuredAnalysis}
            onOpenRandomDoor={handleOpenRandomDoor}
            randomDoorPending={randomDoorPending}
            onStartNewTask={handleStartNewTask}
            onReturnToUnderstanding={handleReturnToUnderstanding}
            starterActionsEnabled={starterActionsEnabled}
            onReachRecommendationStep={handleReachRecommendationStep}
            scrollOnReachRecommendation={prefersCompactStage}
            sessionDock={sessionDock}
          />
        </div>

        <div className="flex h-full min-h-0 flex-col">
          <AnalysisStagePanel
            appState={appState}
            analysisFlow={analysisFlow}
            mobileCompact={showMobileCompactStage}
            mobileCompactExpanded={mobileStageExpanded}
            onToggleMobileCompact={() => setMobileStageExpanded((value) => !value)}
            voiceFabDisabled={voiceFabDisabled}
            onHoldToTalkStart={holdToTalkStart}
            onHoldToTalkEnd={holdToTalkEnd}
            onCancelVoiceInput={cancelVoiceInput}
          />
        </div>
      </div>
    </PageShell>
  )
}
