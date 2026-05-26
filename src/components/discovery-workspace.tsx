import { useMemo, useState } from 'react'
import { CompactDecisionPanel } from '@/components/discovery/compact-decision-panel'
import {
  isStepDone,
  resolveCurrentStep,
  resolveMaxVisibleStep,
  type AnalysisFlow,
} from '@/components/discovery/analysis-stage-content'
import { DecisionProgressSteps } from '@/components/discovery/decision-progress-steps'
import { LiveAnalysisTrackCard } from '@/components/discovery/live-analysis-track-card'
import { WhereToStartSection } from '@/components/discovery/where-to-start-section'
import { DisplayPanel } from '@/components/ui/display-shell'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market-types'
import type { AppState } from '@/store'

type DiscoveryWorkspaceProps = {
  currentPrompt: string | null
  appState: AppState
  analysisFlow: AnalysisFlow
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

export function DiscoveryWorkspace({
  currentPrompt,
  appState,
  analysisFlow,
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
  const hasPrompt = Boolean(currentPrompt?.trim())
  const hasResult = Boolean(agentPayload || selectedToolPayload?.toolId)
  const currentStep = useMemo(
    () => resolveCurrentStep(analysisFlow, hasPrompt, hasResult),
    [analysisFlow, hasPrompt, hasResult],
  )
  const maxVisibleStep = useMemo(
    () => resolveMaxVisibleStep(analysisFlow, hasPrompt, hasResult),
    [analysisFlow, hasPrompt, hasResult],
  )
  const [manualExpandedStep, setManualExpandedStep] = useState<number | null>(null)
  const expandedStep =
    manualExpandedStep != null &&
    manualExpandedStep < currentStep &&
    manualExpandedStep <= maxVisibleStep
      ? manualExpandedStep
      : currentStep

  const handleStepClick = (step: number) => {
    if (step > maxVisibleStep) return
    if (step === currentStep) {
      setManualExpandedStep(null)
      return
    }
    if (isStepDone(step, currentStep)) {
      setManualExpandedStep(step)
    }
  }

  const activePanelStep = expandedStep <= maxVisibleStep ? (expandedStep as 1 | 2 | 3) : null

  return (
    <DisplayPanel className="pointer-events-auto flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] bg-white/90">
      <div className="shrink-0 border-b border-border/45 px-3 py-2 sm:px-4 sm:py-2.5">
        <DecisionProgressSteps
          currentStep={currentStep}
          maxVisibleStep={maxVisibleStep}
          expandedStep={expandedStep}
          onStepClick={handleStepClick}
        />
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 pt-2 pb-4 sm:px-4 sm:pb-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          {activePanelStep != null ? (
            <section className="overflow-hidden rounded-[1.8rem] border border-border/65 bg-white/86 p-3 shadow-sm sm:p-4">
              {activePanelStep === 1 ? (
                <div className="space-y-3">
                  <WhereToStartSection onDraftTask={onDraftTask} />
                </div>
              ) : null}
              {activePanelStep === 2 ? (
                <LiveAnalysisTrackCard
                  currentPrompt={currentPrompt}
                  payload={agentPayload}
                  appState={appState}
                  analysisFlow={analysisFlow}
                />
              ) : null}
              {activePanelStep === 3 ? (
                <CompactDecisionPanel
                  payload={agentPayload}
                  selectedToolPayload={selectedToolPayload}
                  analysisFlow={analysisFlow}
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
              ) : null}
            </section>
          ) : null}
        </div>
      </ScrollArea>
    </DisplayPanel>
  )
}
