'use client'

import { useRef } from 'react'
import {
  DoraBottomInteractionZone,
  type DoraBottomInteractionZoneProps,
} from '@/components/dora-bottom-interaction-zone'
import { cn } from '@/lib/utils'
import {
  canAdvanceStarterStep,
  composeStarterPrompt,
  resolveStarterDisplayGoal,
  type StarterIntake,
  type StarterWizardStep,
} from '@/shared/starter-intake'
import { PAGE_COPY } from '@/shared/ui-copy'

export type AnalysisInteractionDockProps = {
  activePanelStep: 1 | 2 | 3 | null
  starterActionsEnabled: boolean
  wizardSubStep: StarterWizardStep
  intake: StarterIntake
  wizardDisabled?: boolean
  onWizardBack: () => void
  onWizardNext: () => void
  onStartAnalysis: (prompt: string, displayPrompt: string) => void | Promise<void>
  onStartNewTask: () => void
  sessionZone: DoraBottomInteractionZoneProps | null
}

export function AnalysisInteractionDock({
  activePanelStep,
  starterActionsEnabled,
  wizardSubStep,
  intake,
  wizardDisabled = false,
  onWizardBack,
  onWizardNext,
  onStartAnalysis,
  onStartNewTask,
  sessionZone,
}: AnalysisInteractionDockProps) {
  const copy = PAGE_COPY.analysis.starter
  const startingRef = useRef(false)

  const canAdvance = canAdvanceStarterStep(intake, wizardSubStep)
  const canStart = canAdvanceStarterStep(intake, 4) && !wizardDisabled

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

  const nextLabel =
    wizardSubStep === 1
      ? copy.nextToOutcome
      : wizardSubStep === 2
        ? copy.nextToConstraints
        : copy.nextToConfirm

  const showNewTaskOnly = activePanelStep === 3 || (activePanelStep === 1 && !starterActionsEnabled)

  return (
    <div className="shrink-0 border-t border-border/45 bg-white/90 backdrop-blur-md">
      {activePanelStep === 2 && sessionZone ? (
        <DoraBottomInteractionZone {...sessionZone} hideVoiceToggle />
      ) : null}

      {showNewTaskOnly ? (
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
        <div className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:px-4 sm:py-3">
          {wizardSubStep > 1 ? (
            <button
              type="button"
              disabled={wizardDisabled}
              onClick={onWizardBack}
              className={cn(
                'rounded-full border border-border/60 bg-white px-4 py-2.5 text-[11px] font-semibold text-foreground/80 transition-colors hover:bg-slate-50 sm:mr-auto',
                wizardDisabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {copy.backAction}
            </button>
          ) : (
            <span className="hidden sm:mr-auto sm:block" />
          )}
          {wizardSubStep < 4 ? (
            <button
              type="button"
              disabled={!canAdvance || wizardDisabled}
              onClick={onWizardNext}
              className={cn(
                'flex flex-1 items-center justify-center rounded-full border-2 border-primary/30 bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-sm transition-colors hover:bg-primary/90',
                (!canAdvance || wizardDisabled) && 'cursor-not-allowed opacity-45',
              )}
            >
              {nextLabel} →
            </button>
          ) : (
            <button
              type="button"
              data-starter-path="wizard"
              disabled={!canStart}
              onClick={handleStart}
              className={cn(
                'flex flex-1 items-center justify-center rounded-full border-2 border-primary/30 bg-primary px-4 py-2.5 text-sm font-black text-primary-foreground shadow-sm transition-colors hover:bg-primary/90',
                !canStart && 'cursor-not-allowed opacity-45',
              )}
            >
              {copy.startAction}
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
