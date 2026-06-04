'use client'

import {
  STARTER_CONSTRAINTS,
  STARTER_ROLES,
  getStarterOutcomeById,
  resolveStarterDisplayGoal,
  type StarterIntake,
} from '@/shared/starter-intake'
import { PAGE_COPY } from '@/shared/ui-copy'

type StarterConfirmStepProps = {
  intake: StarterIntake
}

export function StarterConfirmStep({ intake }: StarterConfirmStepProps) {
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
    <div className="space-y-3">
      <div>
        <p className="text-lg font-black text-foreground sm:text-xl">{copy.step4Title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.step4Hint}</p>
      </div>
      <dl className="space-y-3 rounded-[1.2rem] border border-border/70 bg-white p-4">
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {copy.summaryRole}
          </dt>
          <dd className="mt-1 text-sm font-semibold text-foreground">{roleLabel}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {copy.summaryGoal}
          </dt>
          <dd className="mt-1 text-sm leading-relaxed text-foreground">{goal}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {copy.summaryConstraints}
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {constraintLabels.length > 0 ? constraintLabels.join('、') : copy.noConstraints}
          </dd>
        </div>
      </dl>
    </div>
  )
}
