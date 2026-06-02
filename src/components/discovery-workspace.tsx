'use client'

import dynamic from 'next/dynamic'
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { CompactDecisionPanel } from '@/components/discovery/compact-decision-panel'
import {
  isStepDone,
  resolveCurrentStep,
  resolveMaxVisibleStep,
  type AnalysisFlow,
} from '@/components/discovery/analysis-stage-content'
import { DecisionProgressSteps } from '@/components/discovery/decision-progress-steps'
import { LiveAnalysisTrackCard } from '@/components/discovery/live-analysis-track-card'
import { WhereToStartSectionSkeleton } from '@/components/discovery/where-to-start-section-skeleton'

const WhereToStartSection = dynamic(
  () =>
    import('@/components/discovery/where-to-start-section').then(
      (module) => module.WhereToStartSection,
    ),
  { ssr: false, loading: () => <WhereToStartSectionSkeleton /> },
)
import { DisplayPanel } from '@/components/ui/display-shell'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market-types'
import type { ProgressStage } from '@/shared/step2-session-types'
import type { UserSettings } from '@/shared/user-settings'
import type { ToolLookupFn } from '@/shared/tool-lookup'
import type { AppState } from '@/store'

type DiscoveryWorkspaceProps = {
  currentPrompt: string | null
  appState: AppState
  analysisFlow: AnalysisFlow
  progressStage?: ProgressStage | null
  agentPayload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  getTool: ToolLookupFn
  explanationMode?: UserSettings['explanationMode']
  onSaveCandidate: (toolId: string) => void
  onLaunchCandidate: (toolId: string) => void
  onOpenExternalCandidate: (url: string) => void
  onDraftTask?: (draft: string) => void
  onReachRecommendationStep?: () => void
  scrollOnReachRecommendation?: boolean
}

export const DiscoveryWorkspace = forwardRef<HTMLElement, DiscoveryWorkspaceProps>(
  function DiscoveryWorkspace(
    {
      currentPrompt,
      appState,
      analysisFlow,
      progressStage = null,
      agentPayload,
      selectedToolPayload,
      getTool,
      explanationMode = 'standard',
      onSaveCandidate,
      onLaunchCandidate,
      onOpenExternalCandidate,
      onDraftTask,
      onReachRecommendationStep,
      scrollOnReachRecommendation = false,
    },
    ref,
  ) {
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
      const target = typeof ref === 'function' ? null : ref?.current
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [currentStep, onReachRecommendationStep, ref, scrollOnReachRecommendation])

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
      <section ref={ref} className="scroll-mt-3 flex h-full min-h-0 flex-1 flex-col">
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
            <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-3">
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
                />
              ) : activePanelStep === 1 ? (
                <WhereToStartSection onDraftTask={onDraftTask} />
              ) : activePanelStep === 2 ? (
                <section className="overflow-hidden rounded-[1.8rem] border border-border/65 bg-white/86 p-3 shadow-sm sm:p-4">
                  <LiveAnalysisTrackCard
                    currentPrompt={currentPrompt}
                    payload={agentPayload}
                    appState={appState}
                    analysisFlow={analysisFlow}
                    progressStage={progressStage}
                  />
                </section>
              ) : null}
            </div>
          </ScrollArea>
        </DisplayPanel>
      </section>
    )
  },
)
