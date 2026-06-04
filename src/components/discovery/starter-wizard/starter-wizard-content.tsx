'use client'

import { cn } from '@/lib/utils'
import { StarterConfirmStep } from '@/components/discovery/starter-wizard/starter-confirm-step'
import { StarterConstraintStep } from '@/components/discovery/starter-wizard/starter-constraint-step'
import { StarterOutcomeStep } from '@/components/discovery/starter-wizard/starter-outcome-step'
import { StarterRoleStep } from '@/components/discovery/starter-wizard/starter-role-step'
import type {
  StarterConstraintId,
  StarterIntake,
  StarterOutcomeId,
  StarterRoleId,
  StarterWizardStep,
} from '@/shared/starter-intake'

const WIZARD_STEPS: StarterWizardStep[] = [1, 2, 3, 4]

export type StarterWizardContentProps = {
  wizardStep: StarterWizardStep
  intake: StarterIntake
  disabled?: boolean
  onSelectRole: (roleId: StarterRoleId) => void
  onSelectOutcome: (outcomeId: StarterOutcomeId) => void
  onToggleConstraint: (constraintId: StarterConstraintId) => void
  onCustomTaskChange: (value: string) => void
}

export function StarterWizardContent({
  wizardStep,
  intake,
  disabled,
  onSelectRole,
  onSelectOutcome,
  onToggleConstraint,
  onCustomTaskChange,
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
            onCustomTaskChange={onCustomTaskChange}
          />
        ) : null}
        {wizardStep === 3 ? (
          <StarterConstraintStep
            intake={intake}
            disabled={disabled}
            onToggleConstraint={onToggleConstraint}
          />
        ) : null}
        {wizardStep === 4 ? <StarterConfirmStep intake={intake} /> : null}
      </div>
    </div>
  )
}
