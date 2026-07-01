'use client'

import { cn } from '@/lib/utils'
import {
  STARTER_OUTCOMES,
  type StarterIntake,
  type StarterOutcomeId,
} from '@/shared/starter-intake'
import { PAGE_COPY } from '@/shared/ui-copy'

type StarterOutcomeStepProps = {
  intake: StarterIntake
  disabled?: boolean
  onSelectOutcome: (outcomeId: StarterOutcomeId) => void
}

export function StarterOutcomeStep({ intake, disabled, onSelectOutcome }: StarterOutcomeStepProps) {
  const copy = PAGE_COPY.analysis.starter

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div>
        <p className="text-lg font-black text-foreground sm:text-xl">{copy.step2Title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.step2Hint}</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {STARTER_OUTCOMES.map((outcome) => {
          const selected = intake.outcomeId === outcome.id
          return (
            <button
              key={outcome.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onSelectOutcome(outcome.id)}
              className={cn(
                'w-full rounded-[1.1rem] border px-3 py-2.5 text-left transition-colors sm:px-4 sm:py-3',
                selected
                  ? 'border-primary bg-primary/[0.08] ring-1 ring-primary/20'
                  : 'border-border/70 bg-white hover:border-primary/25',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <span className="block text-sm font-black text-foreground">{outcome.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {outcome.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
