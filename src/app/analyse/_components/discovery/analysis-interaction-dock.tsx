'use client'

import { useRef } from 'react'
import {
  DoraBottomInteractionZone,
  type DoraBottomInteractionZoneProps,
} from '@/app/analyse/_components/interaction/dora-bottom-interaction-zone'
import { cn } from '@/lib/utils'
import {
  canStartStarterAnalysis,
  composeStarterPrompt,
  resolveStarterDisplayGoal,
  type StarterIntake,
  type StarterIntentStatus,
} from '@/shared/discovery/starter-intake'
import { PAGE_COPY } from '@/shared/copy/ui-copy'

export type AnalysisInteractionDockProps = {
  activePanelStep: 1 | 2 | 3 | null
  starterActionsEnabled: boolean
  intake: StarterIntake
  hasPrompt: boolean
  showRecommendationActions: boolean
  naturalDescription: string
  intentStatus: StarterIntentStatus
  wizardDisabled?: boolean
  onApplyNaturalDescription: (value: string) => void | Promise<void>
  onReviewBackToInput: () => void
  onStartAnalysis: (prompt: string, displayPrompt: string) => void | Promise<void>
  onStartNewTask: () => void
  onReturnToUnderstanding: () => void
  sessionZone: DoraBottomInteractionZoneProps | null
}

export function AnalysisInteractionDock({
  activePanelStep,
  starterActionsEnabled,
  intake,
  hasPrompt,
  showRecommendationActions,
  naturalDescription,
  intentStatus,
  wizardDisabled = false,
  onApplyNaturalDescription,
  onReviewBackToInput,
  onStartAnalysis,
  onStartNewTask,
  onReturnToUnderstanding,
  sessionZone,
}: AnalysisInteractionDockProps) {
  const copy = PAGE_COPY.analysis.starter
  const startingRef = useRef(false)

  const canStart = canStartStarterAnalysis(intake) && !wizardDisabled
  const canApplyNaturalDescription = naturalDescription.trim().length >= 4 && !wizardDisabled
  const analyzingIntent = intentStatus === 'analyzing'

  const handleStart = async () => {
    if (startingRef.current || !canStart) return
    startingRef.current = true
    try {
      const prompt = composeStarterPrompt(intake)
      await Promise.resolve(onStartAnalysis(prompt, resolveStarterDisplayGoal(intake)))
    } finally {
      startingRef.current = false
    }
  }

  const handleAnalyzeInput = () => {
    if (!canApplyNaturalDescription) return
    void onApplyNaturalDescription(naturalDescription)
  }

  const showSessionZone =
    activePanelStep === 3 && hasPrompt && !showRecommendationActions && sessionZone
  const showNewTaskOnly =
    (activePanelStep === 3 && !hasPrompt) || (activePanelStep === 1 && !starterActionsEnabled)

  return (
    <div className="shrink-0 border-t border-border/45 bg-white/90 backdrop-blur-md">
      {showSessionZone ? <DoraBottomInteractionZone {...sessionZone} hideVoiceToggle /> : null}
      {activePanelStep === 2 && hasPrompt && sessionZone ? (
        <DoraBottomInteractionZone {...sessionZone} hideVoiceToggle />
      ) : null}

      {activePanelStep === 3 && showRecommendationActions ? (
        <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:px-4 sm:py-3">
          <button
            type="button"
            onClick={onReturnToUnderstanding}
            className="rounded-full border border-border/60 bg-white px-4 py-2.5 text-[11px] font-semibold text-foreground/80 transition-colors hover:bg-slate-50 sm:w-40"
          >
            {copy.returnToUnderstandingAction}
          </button>
          <button
            type="button"
            onClick={onStartNewTask}
            className="flex flex-1 items-center justify-center rounded-full border-2 border-primary/30 bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {copy.newTaskAction}
          </button>
        </div>
      ) : showSessionZone ? null : showNewTaskOnly ? (
        <div className="px-3 py-2.5 sm:px-4 sm:py-3">
          <button
            type="button"
            onClick={onStartNewTask}
            className="flex w-full items-center justify-center rounded-full border-2 border-primary/30 bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {copy.newTaskAction}
          </button>
        </div>
      ) : activePanelStep === 1 && starterActionsEnabled ? (
        <div className="px-3 py-2.5 sm:px-4 sm:py-3">
          <button
            type="button"
            disabled={!canApplyNaturalDescription || analyzingIntent}
            onClick={handleAnalyzeInput}
            className={cn(
              'flex w-full items-center justify-center rounded-full border-2 border-primary/30 bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-sm transition-colors hover:bg-primary/90',
              (!canApplyNaturalDescription || analyzingIntent) && 'cursor-not-allowed opacity-45',
            )}
          >
            {analyzingIntent ? copy.naturalDraftLoadingAction : copy.naturalDraftAction}
          </button>
        </div>
      ) : activePanelStep === 2 && starterActionsEnabled && !hasPrompt ? (
        <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:px-4 sm:py-3">
          <button
            type="button"
            disabled={wizardDisabled}
            onClick={onReviewBackToInput}
            className={cn(
              'rounded-full border border-border/60 bg-white px-4 py-2.5 text-[11px] font-semibold text-foreground/80 transition-colors hover:bg-slate-50 sm:w-40',
              wizardDisabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {copy.backToInputAction}
          </button>
          <button
            type="button"
            data-starter-path="understanding-review"
            disabled={!canStart}
            onClick={handleStart}
            className={cn(
              'flex flex-1 items-center justify-center rounded-full border-2 border-primary/30 bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-sm transition-colors hover:bg-primary/90',
              !canStart && 'cursor-not-allowed opacity-45',
            )}
          >
            {copy.confirmUnderstandingAction}
          </button>
        </div>
      ) : null}
    </div>
  )
}
