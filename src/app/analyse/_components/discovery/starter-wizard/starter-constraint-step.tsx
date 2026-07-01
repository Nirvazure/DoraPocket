'use client'

import { cn } from '@/lib/utils'
import {
  STARTER_CONSTRAINT_DIMENSIONS,
  type StarterConstraintId,
  type StarterIntake,
} from '@/shared/discovery/starter-intake'
import { PAGE_COPY } from '@/shared/copy/ui-copy'

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
  const selectedCount = intake.constraintIds.length

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="shrink-0">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-lg font-black text-foreground sm:text-xl">{copy.step3Title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{copy.step3Hint}</p>
          </div>
          <span className="rounded-full border border-border/60 bg-white px-3 py-1 text-[11px] font-semibold text-muted-foreground">
            已选 {selectedCount} 项
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {STARTER_CONSTRAINT_DIMENSIONS.map((dimension) => (
          <section
            key={dimension.id}
            className="rounded-[1.35rem] border border-border/70 bg-white/90 p-3 sm:p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-foreground">{dimension.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {dimension.hint}
                </p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
              {dimension.options.map((constraint) => {
                const selected = intake.constraintIds.includes(constraint.id)
                return (
                  <button
                    key={constraint.id}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    onClick={() => onToggleConstraint(constraint.id)}
                    className={cn(
                      'min-h-[2.75rem] rounded-[1rem] border px-3 py-2.5 text-left text-[11px] font-semibold transition-colors sm:text-xs',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border/60 bg-slate-50/80 text-foreground/85 hover:border-primary/25 hover:bg-white',
                      disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    {constraint.label}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
