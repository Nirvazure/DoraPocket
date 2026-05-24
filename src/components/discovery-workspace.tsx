import { useMemo, useState, type ReactNode } from 'react'
import { CompactDecisionPanel } from '@/components/discovery/compact-decision-panel'
import {
  isStepDone,
  resolveCurrentStep,
  resolveMaxVisibleStep,
  type AnalysisStage,
} from '@/components/discovery/analysis-stage-content'
import { DecisionProgressSteps } from '@/components/discovery/decision-progress-steps'
import { LiveAnalysisTrackCard } from '@/components/discovery/live-analysis-track-card'
import { NextActionBar } from '@/components/discovery/next-action-bar'
import { WhereToStartSection } from '@/components/discovery/where-to-start-section'
import { DisplayPanel } from '@/components/ui/display-shell'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatToolPayload } from '@/services/llm'
import type { AgentUiPayload } from '@/shared/market-types'
import type { AppState } from '@/store'

type DiscoveryWorkspaceProps = {
  currentPrompt: string | null
  appState: AppState
  analysisStage: AnalysisStage
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

const STEP_TITLES = {
  1: '从哪里开始',
  2: '分析过程',
  3: '推荐结果和反馈',
} as const

export function DiscoveryWorkspace({
  currentPrompt,
  appState,
  analysisStage,
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
    () => resolveCurrentStep(analysisStage, hasPrompt, hasResult),
    [analysisStage, hasPrompt, hasResult],
  )
  const maxVisibleStep = useMemo(
    () => resolveMaxVisibleStep(analysisStage, hasPrompt, hasResult),
    [analysisStage, hasPrompt, hasResult],
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

  const renderStepSection = (step: 1 | 2 | 3, content: ReactNode) => {
    if (step > maxVisibleStep) return null

    const expanded = expandedStep === step

    return (
      <section
        key={step}
        className="overflow-hidden rounded-[1.8rem] border border-border/65 bg-white/86 shadow-sm"
      >
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/80 sm:px-5"
          onClick={() => handleStepClick(step)}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Step {step}
            </p>
            <p className="mt-1 text-base font-black text-slate-950 sm:text-lg">
              {STEP_TITLES[step]}
            </p>
          </div>
        </button>
        {expanded ? <div className="border-t border-border/50">{content}</div> : null}
      </section>
    )
  }

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

      <ScrollArea className="min-h-0 flex-1 px-3 py-2 sm:px-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          {renderStepSection(
            1,
            <div className="space-y-3 p-3 sm:p-4">
              <WhereToStartSection onDraftTask={onDraftTask} />
            </div>,
          )}

          {renderStepSection(
            2,
            <div className="p-3 sm:p-4">
              <LiveAnalysisTrackCard
                currentPrompt={currentPrompt}
                payload={agentPayload}
                selectedToolPayload={selectedToolPayload}
                appState={appState}
                analysisStage={analysisStage}
              />
            </div>,
          )}

          {renderStepSection(
            3,
            <div className="p-3 sm:p-4">
              <CompactDecisionPanel
                payload={agentPayload}
                selectedToolPayload={selectedToolPayload}
                analysisStage={analysisStage}
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
            </div>,
          )}
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
