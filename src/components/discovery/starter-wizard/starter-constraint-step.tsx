'use client'

import { cn } from '@/lib/utils'
import {
  STARTER_CONSTRAINTS,
  type StarterConstraintId,
  type StarterIntake,
} from '@/shared/starter-intake'
import { PAGE_COPY } from '@/shared/ui-copy'

type StarterConstraintStepProps = {
  intake: StarterIntake
  disabled?: boolean
  onToggleConstraint: (constraintId: StarterConstraintId) => void
}

export function StarterConstraintStep({
  intake,
  disabled,
  onToggleConstraint,
}: StarterConstraintStepProps) {
  const copy = PAGE_COPY.analysis.starter

  return (
    <div className="space-y-3">
      <div>
        <p className="text-lg font-black text-foreground sm:text-xl">{copy.step3Title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.step3Hint}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {STARTER_CONSTRAINTS.map((constraint) => {
          const selected = intake.constraintIds.includes(constraint.id)
          return (
            <button
              key={constraint.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onToggleConstraint(constraint.id)}
              className={cn(
                'rounded-full border px-3 py-2 text-[11px] font-semibold transition-colors sm:text-xs',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/60 bg-white text-foreground/80 hover:border-primary/25',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              {constraint.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
