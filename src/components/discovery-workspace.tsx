import { useState } from 'react'
import { CompactDecisionPanel } from '@/components/discovery/compact-decision-panel'
import { ContextInputCard } from '@/components/discovery/context-input-card'
import { DecisionProgressSteps } from '@/components/discovery/decision-progress-steps'
import { DecisionSummaryCard } from '@/components/discovery/decision-summary-card'
import { NextActionBar } from '@/components/discovery/next-action-bar'
import { StepOneContextStack } from '@/components/discovery/step-one-context-stack'
import { HelpStarterStrip } from '@/components/help-starter-panel'
import { DisplayPanel } from '@/components/ui/display-shell'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatToolPayload } from '@/services/llm'
import type { AgentUiPayload } from '@/shared/market-types'
import type { AppState } from '@/store'

type DiscoveryWorkspaceProps = {
  currentPrompt: string | null
  appState: AppState
  agentPayload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  autoSaveEnabled: boolean
  autoSaveNotice: { toolId: string; label: string } | null
  onOpenPocket: () => void
  onSaveCandidate: (toolId: string) => void
  onLaunchCandidate: (toolId: string) => void
  onOpenExternalCandidate: (url: string) => void
  onUndoAutoSave: () => void
  onEnableAutoSave: () => void
  onFeedback: (toolId: string, vote: 'up' | 'down') => void
  onDraftTask?: (draft: string) => void
}

function resolveWorkspaceStepState(
  currentPrompt: string | null,
  agentPayload: AgentUiPayload | null,
  stepViewState: { suggestedStep: number; activeStep: number },
) {
  const hasPrompt = Boolean(currentPrompt?.trim())
  const hasPayload = Boolean(agentPayload)
  const suggestedStep = hasPayload ? 3 : hasPrompt ? 2 : 1
  const activeStep =
    stepViewState.suggestedStep === suggestedStep ? stepViewState.activeStep : suggestedStep

  return {
    hasPrompt,
    hasPayload,
    suggestedStep,
    activeStep,
    showStarterStrip: !hasPrompt && !hasPayload,
  }
}

export function DiscoveryWorkspace({
  currentPrompt,
  appState,
  agentPayload,
  selectedToolPayload,
  autoSaveEnabled,
  autoSaveNotice,
  onOpenPocket,
  onSaveCandidate,
  onLaunchCandidate,
  onOpenExternalCandidate,
  onUndoAutoSave,
  onEnableAutoSave,
  onFeedback,
  onDraftTask,
}: DiscoveryWorkspaceProps) {
  const [stepViewState, setStepViewState] = useState({ suggestedStep: 1, activeStep: 1 })
  const { activeStep, suggestedStep, showStarterStrip } = resolveWorkspaceStepState(
    currentPrompt,
    agentPayload,
    stepViewState,
  )
  const setActiveStep = (step: number) => setStepViewState({ suggestedStep, activeStep: step })

  return (
    <DisplayPanel className="pointer-events-auto flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] bg-white/90">
      <div className="shrink-0 border-b border-border/45 px-3 py-2 sm:px-4 sm:py-2.5">
        <DecisionProgressSteps currentStep={activeStep} onStepClick={setActiveStep} />
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 py-2 sm:px-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          {activeStep === 1 ? (
            showStarterStrip && onDraftTask ? (
              <HelpStarterStrip onDraftChange={onDraftTask} />
            ) : currentPrompt?.trim() ? (
              <StepOneContextStack currentPrompt={currentPrompt.trim()} />
            ) : null
          ) : null}

          {activeStep === 2 ? (
            <div className="space-y-3">
              <DecisionSummaryCard
                payload={agentPayload}
                currentPrompt={currentPrompt}
                appState={appState}
              />
              <ContextInputCard payload={agentPayload} />
            </div>
          ) : null}

          {activeStep === 3 ? (
            <div className="space-y-3">
              <CompactDecisionPanel
                payload={agentPayload}
                selectedToolPayload={selectedToolPayload}
                autoSaveNotice={autoSaveNotice}
                autoSaveEnabled={autoSaveEnabled}
                onSaveCandidate={onSaveCandidate}
                onLaunchCandidate={onLaunchCandidate}
                onOpenExternalCandidate={onOpenExternalCandidate}
                onOpenPocket={onOpenPocket}
                onUndoAutoSave={onUndoAutoSave}
                onEnableAutoSave={onEnableAutoSave}
                onFeedback={onFeedback}
              />
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="shrink-0 px-3 pb-3 sm:px-4">
        <NextActionBar
          payload={agentPayload}
          selectedToolPayload={selectedToolPayload}
          onLaunchCandidate={onLaunchCandidate}
          onOpenExternalCandidate={onOpenExternalCandidate}
          onSaveCandidate={onSaveCandidate}
          onOpenPocket={onOpenPocket}
        />
      </div>
    </DisplayPanel>
  )
}
