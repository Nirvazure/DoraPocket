'use client'

import {
  STARTER_CONSTRAINTS,
  STARTER_ROLES,
  getStarterOutcomeById,
  resolveStarterDisplayGoal,
  type StarterIntake,
} from '@/shared/starter-intake'
import { PAGE_COPY } from '@/shared/ui-copy'

type StarterIntakeSummaryProps = {
  intake: StarterIntake
}

export function StarterIntakeSummary({ intake }: StarterIntakeSummaryProps) {
  const copy = PAGE_COPY.analysis.starter
  const roleLabel =
    STARTER_ROLES.find((role) => role.id === intake.roleId)?.label ?? copy.roleUnspecified
  const constraintLabels = STARTER_CONSTRAINTS.filter((item) =>
    intake.constraintIds.includes(item.id),
  ).map((item) => item.label)
  const goal =
    resolveStarterDisplayGoal(intake) ||
    (intake.outcomeId ? getStarterOutcomeById(intake.outcomeId)?.title : '')

  return (
    <div className="rounded-[1.35rem] border border-primary/15 bg-primary/[0.04] p-4">
      <div className="mb-3">
        <p className="text-sm font-black text-foreground">{copy.intakeSummaryTitle}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {copy.intakeSummaryHint}
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1rem] border border-border/60 bg-white/90 px-3 py-2.5">
          <dt className="text-xs font-medium text-muted-foreground">{copy.summaryRole}</dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{roleLabel}</dd>
        </div>
        <div className="rounded-[1rem] border border-border/60 bg-white/90 px-3 py-2.5 sm:col-span-1">
          <dt className="text-xs font-medium text-muted-foreground">{copy.summaryGoal}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-foreground">{goal || '—'}</dd>
        </div>
        <div className="rounded-[1rem] border border-border/60 bg-white/90 px-3 py-2.5">
          <dt className="text-xs font-medium text-muted-foreground">{copy.summaryConstraints}</dt>
          <dd className="mt-1 text-sm text-foreground">
            {constraintLabels.length > 0 ? constraintLabels.join('、') : copy.noConstraints}
          </dd>
        </div>
      </dl>
    </div>
  )
}
