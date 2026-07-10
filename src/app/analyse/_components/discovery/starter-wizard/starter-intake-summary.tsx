'use client'

import { STARTER_CONSTRAINTS, type StarterIntake } from '@/shared/discovery/starter-intake'
import { PAGE_COPY } from '@/shared/copy/ui-copy'

function useStarterConstraintText(intake: StarterIntake) {
  const copy = PAGE_COPY.analysis.starter
  const constraintLabels = STARTER_CONSTRAINTS.filter((item) =>
    intake.constraintIds.includes(item.id),
  ).map((item) => item.label)

  return {
    copy,
    constraintText: constraintLabels.length > 0 ? constraintLabels.join('、') : copy.noConstraints,
  }
}

type StarterIntakeFieldProps = {
  intake: StarterIntake
  className?: string
}

export function StarterIntakeConstraintField({ intake, className }: StarterIntakeFieldProps) {
  const { copy, constraintText } = useStarterConstraintText(intake)

  return (
    <dl className={className}>
      <div className="rounded-[1rem] border border-border/60 bg-white/90 px-3.5 py-3">
        <dt className="text-xs font-medium text-muted-foreground">{copy.summaryConstraints}</dt>
        <dd className="mt-1.5 text-sm font-medium leading-relaxed text-foreground">
          {constraintText}
        </dd>
      </div>
    </dl>
  )
}
