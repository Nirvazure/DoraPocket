'use client'

import dynamic from 'next/dynamic'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnalysisInteractionDock } from '@/app/analyse/_components/discovery/analysis-interaction-dock'
import type { DoraBottomInteractionZoneProps } from '@/app/analyse/_components/interaction/dora-bottom-interaction-zone'
import { CompactDecisionPanel } from '@/app/analyse/_components/discovery/compact-decision-panel'
import {
  isStepDone,
  resolveCurrentStep,
  resolveMaxVisibleStep,
  type AnalysisFlow,
} from '@/app/analyse/_domain/analysis-stage-content'
import { DecisionProgressSteps } from '@/app/analyse/_components/discovery/decision-progress-steps'
import { StarterUnderstandingReview } from '@/app/analyse/_components/discovery/starter-understanding-review'
import { WhereToStartSectionSkeleton } from '@/app/analyse/_components/discovery/where-to-start-section-skeleton'
import { DisplayPanel } from '@/components/ui/display-shell'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useStarterWizardState,
  type StarterWizardStateHandle,
} from '@/app/analyse/_hooks/use-starter-wizard-state'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market/market-types'
import type { UserSettings } from '@/shared/user/user-settings'
import type { ToolLookupFn } from '@/shared/market/tool-lookup'

const WhereToStartSection = dynamic(
  () =>
    import('@/app/analyse/_components/discovery/where-to-start-section').then(
      (module) => module.WhereToStartSection,
    ),
  { ssr: false, loading: () => <WhereToStartSectionSkeleton /> },
)

export type DiscoveryWorkspaceHandle = StarterWizardStateHandle

type DiscoveryWorkspaceProps = {
  currentPrompt: string | null
  analysisFlow: AnalysisFlow
  agentPayload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  getTool: ToolLookupFn
  explanationMode?: UserSettings['explanationMode']
  onSaveCandidate: (toolId: string) => void
  onLaunchCandidate: (toolId: string) => void
  onOpenExternalCandidate: (url: string) => void
  recommendationSessionId?: string | null
  onStartAnalysis?: (prompt: string, displayPrompt: string) => void | Promise<void>
  onStartNewTask?: () => void
  onReturnToUnderstanding?: () => void
  starterActionsEnabled?: boolean
  onReachRecommendationStep?: () => void
  scrollOnReachRecommendation?: boolean
  sessionDock: DoraBottomInteractionZoneProps | null
}

export const DiscoveryWorkspace = forwardRef<DiscoveryWorkspaceHandle, DiscoveryWorkspaceProps>(
  function DiscoveryWorkspace(
    {
      currentPrompt,
      analysisFlow,
      agentPayload,
      selectedToolPayload,
      getTool,
      explanationMode = 'standard',
      onSaveCandidate,
      onLaunchCandidate,
      onOpenExternalCandidate,
      recommendationSessionId = null,
      onStartAnalysis,
      onStartNewTask,
      onReturnToUnderstanding,
      starterActionsEnabled = true,
      onReachRecommendationStep,
      scrollOnReachRecommendation = false,
      sessionDock,
    },
    ref,
  ) {
    const wizard = useStarterWizardState(ref)
    const sectionRef = useRef<HTMLElement>(null)

    const hasPrompt = Boolean(currentPrompt?.trim())
    const hasResult = Boolean(agentPayload || selectedToolPayload?.toolId)
    const showRecommendationActions = hasResult && analysisFlow.phase === 'revealed'
    const hasUnderstandingDraft = wizard.lastDraftSource.trim().length > 0
    const reviewingUnderstanding = !hasPrompt && hasUnderstandingDraft
    const currentStep = useMemo(() => {
      if (reviewingUnderstanding) return 2
      return resolveCurrentStep(analysisFlow, hasPrompt, hasResult)
    }, [analysisFlow, hasPrompt, hasResult, reviewingUnderstanding])
    const maxVisibleStep = useMemo(() => {
      if (reviewingUnderstanding) return 2
      return resolveMaxVisibleStep(analysisFlow, hasPrompt, hasResult)
    }, [analysisFlow, hasPrompt, hasResult, reviewingUnderstanding])
    const [manualExpandedStep, setManualExpandedStep] = useState<number | null>(null)
    const previousStepRef = useRef(currentStep)
    const expandedStep =
      manualExpandedStep != null &&
      manualExpandedStep < currentStep &&
      manualExpandedStep <= maxVisibleStep
        ? manualExpandedStep
        : currentStep

    useEffect(() => {
      const reachedRecommendation = currentStep === 3 && previousStepRef.current !== 3
      previousStepRef.current = currentStep
      if (!reachedRecommendation) return
      onReachRecommendationStep?.()
      if (!scrollOnReachRecommendation) return
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [currentStep, onReachRecommendationStep, scrollOnReachRecommendation])

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

    const handleStartNewTask = useCallback(() => {
      wizard.reset()
      onStartNewTask?.()
    }, [onStartNewTask, wizard])

    const handleReturnToUnderstanding = useCallback(() => {
      setManualExpandedStep(null)
      onReturnToUnderstanding?.()
    }, [onReturnToUnderstanding])

    return (
      <section ref={sectionRef} className="scroll-mt-3 flex h-full min-h-0 flex-1 flex-col">
        <DisplayPanel className="pointer-events-auto flex h-full min-h-0 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border/45 px-3 py-2 sm:px-4 sm:py-2.5">
            <DecisionProgressSteps
              currentStep={currentStep}
              maxVisibleStep={maxVisibleStep}
              expandedStep={expandedStep}
              onStepClick={handleStepClick}
            />
          </div>

          <ScrollArea className="min-h-0 flex-1 px-3 pt-2 pb-4 sm:px-4 sm:pb-4">
            <div className="flex min-h-full w-full flex-col gap-3">
              {activePanelStep === 3 ? (
                <CompactDecisionPanel
                  payload={agentPayload}
                  selectedToolPayload={selectedToolPayload}
                  analysisFlow={analysisFlow}
                  getTool={getTool}
                  explanationMode={explanationMode}
                  onSaveCandidate={onSaveCandidate}
                  onLaunchCandidate={onLaunchCandidate}
                  onOpenExternalCandidate={onOpenExternalCandidate}
                  recommendationSessionId={recommendationSessionId}
                />
              ) : activePanelStep === 1 ? (
                <WhereToStartSection
                  actionsEnabled={starterActionsEnabled}
                  wizardDisabled={!starterActionsEnabled}
                  naturalDescription={wizard.naturalDescription}
                  onNaturalDescriptionChange={wizard.handleNaturalDescriptionChange}
                />
              ) : activePanelStep === 2 ? (
                <section className="dp-secondary-surface overflow-hidden p-3 sm:p-4">
                  <StarterUnderstandingReview
                    intake={wizard.intake}
                    sourceText={wizard.lastDraftSource}
                    intentStatus={wizard.intentStatus}
                    intentNote={wizard.intentNote}
                    disabled={!starterActionsEnabled}
                    onSelectRole={wizard.selectRole}
                    onSelectOutcome={wizard.selectOutcome}
                    onToggleConstraint={wizard.toggleConstraint}
                    onCustomTaskChange={wizard.handleCustomTaskChange}
                  />
                </section>
              ) : null}
            </div>
          </ScrollArea>

          <AnalysisInteractionDock
            activePanelStep={activePanelStep}
            starterActionsEnabled={starterActionsEnabled}
            intake={wizard.intake}
            hasPrompt={hasPrompt}
            showRecommendationActions={showRecommendationActions}
            naturalDescription={wizard.naturalDescription}
            wizardDisabled={!starterActionsEnabled || wizard.intentStatus === 'analyzing'}
            intentStatus={wizard.intentStatus}
            onApplyNaturalDescription={async (value) => {
              const draft = await wizard.applyNaturalDescription(value)
              if (!draft) return
              setManualExpandedStep(null)
            }}
            onReviewBackToInput={() => setManualExpandedStep(1)}
            onStartAnalysis={(prompt, displayPrompt) => onStartAnalysis?.(prompt, displayPrompt)}
            onStartNewTask={handleStartNewTask}
            onReturnToUnderstanding={handleReturnToUnderstanding}
            sessionZone={sessionDock}
          />
        </DisplayPanel>
      </section>
    )
  },
)
