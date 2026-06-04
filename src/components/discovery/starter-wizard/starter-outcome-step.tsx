'use client'

import { cn } from '@/lib/utils'
import {
  getStarterOutcomeById,
  STARTER_OUTCOMES,
  type StarterIntake,
  type StarterOutcomeId,
} from '@/shared/starter-intake'
import { PAGE_COPY } from '@/shared/ui-copy'

type StarterOutcomeStepProps = {
  intake: StarterIntake
  disabled?: boolean
  onSelectOutcome: (outcomeId: StarterOutcomeId) => void
  onCustomTaskChange: (value: string) => void
}

export function StarterOutcomeStep({
  intake,
  disabled,
  onSelectOutcome,
  onCustomTaskChange,
}: StarterOutcomeStepProps) {
  const copy = PAGE_COPY.analysis.starter

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div>
        <p className="text-lg font-black text-foreground sm:text-xl">{copy.step2Title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.step2Hint}</p>
      </div>
      <div className="max-h-[min(22rem,42vh)] space-y-2 overflow-y-auto pr-1">
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
      <div>
        <textarea
          value={intake.customTask}
          disabled={disabled}
          rows={2}
          placeholder={copy.customTaskPlaceholder}
          className={cn(
            'w-full resize-none rounded-2xl border border-border/70 bg-white px-3 py-2.5 font-sans text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus-visible:ring-2',
            disabled && 'cursor-not-allowed opacity-50',
          )}
          onChange={(event) => {
            const value = event.target.value
            onCustomTaskChange(value)
          }}
        />
        {intake.outcomeId && intake.customTask.trim() ? (
          <p className="mt-1 text-[11px] text-muted-foreground">
            已选目标：{getStarterOutcomeById(intake.outcomeId)?.title}；自填内容优先作为任务描述。
          </p>
        ) : null}
      </div>
    </div>
  )
}
