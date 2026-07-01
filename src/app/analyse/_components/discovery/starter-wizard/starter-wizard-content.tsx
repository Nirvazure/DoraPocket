'use client'

import { cn } from '@/lib/utils'
import { StarterConstraintStep } from '@/app/analyse/_components/discovery/starter-wizard/starter-constraint-step'
import { StarterOutcomeStep } from '@/app/analyse/_components/discovery/starter-wizard/starter-outcome-step'
import { StarterRoleStep } from '@/app/analyse/_components/discovery/starter-wizard/starter-role-step'
import type {
  StarterConstraintId,
  StarterIntake,
  StarterOutcomeId,
  StarterRoleId,
  StarterWizardStep,
} from '@/shared/starter-intake'

const WIZARD_STEPS: StarterWizardStep[] = [1, 2, 3]

export type StarterWizardContentProps = {
  wizardStep: StarterWizardStep
  intake: StarterIntake
  disabled?: boolean
  onSelectRole: (roleId: StarterRoleId) => void
  onSelectOutcome: (outcomeId: StarterOutcomeId) => void
  onToggleConstraint: (constraintId: StarterConstraintId) => void
}

export function StarterWizardContent({
  wizardStep,
  intake,
  disabled,
  onSelectRole,
  onSelectOutcome,
  onToggleConstraint,
}: StarterWizardContentProps) {
  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex items-center gap-2">
        {WIZARD_STEPS.map((step) => (
          <span
            key={step}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              step <= wizardStep ? 'bg-primary' : 'bg-primary/15',
            )}
            aria-hidden
          />
        ))}
      </div>

      <div className="min-h-0 flex-1">
        {wizardStep === 1 ? (
          <StarterRoleStep intake={intake} disabled={disabled} onSelectRole={onSelectRole} />
        ) : null}
        {wizardStep === 2 ? (
          <StarterOutcomeStep
            intake={intake}
            disabled={disabled}
            onSelectOutcome={onSelectOutcome}
          />
        ) : null}
        {wizardStep === 3 ? (
          <StarterConstraintStep
            intake={intake}
            disabled={disabled}
            onToggleConstraint={onToggleConstraint}
          />
        ) : null}
      </div>
    </div>
  )
}
