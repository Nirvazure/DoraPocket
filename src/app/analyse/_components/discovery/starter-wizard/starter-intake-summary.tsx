'use client'

import {
  STARTER_CONSTRAINTS,
  STARTER_ROLES,
  getStarterOutcomeById,
  resolveStarterDisplayGoal,
  type StarterIntake,
} from '@/shared/discovery/starter-intake'
import { PAGE_COPY } from '@/shared/copy/ui-copy'
import { cn } from '@/lib/utils'

function useStarterIntakeLabels(intake: StarterIntake) {
  const copy = PAGE_COPY.analysis.starter
  const roleLabel =
    STARTER_ROLES.find((role) => role.id === intake.roleId)?.label ?? copy.roleUnspecified
  const constraintLabels = STARTER_CONSTRAINTS.filter((item) =>
    intake.constraintIds.includes(item.id),
  ).map((item) => item.label)
  const goal =
    resolveStarterDisplayGoal(intake) ||
    (intake.outcomeId ? getStarterOutcomeById(intake.outcomeId)?.title : '')

  return {
    copy,
    roleLabel,
    goal,
    constraintText: constraintLabels.length > 0 ? constraintLabels.join('、') : copy.noConstraints,
  }
}

type StarterIntakeFieldProps = {
  intake: StarterIntake
  className?: string
}

export function StarterIntakeTaskFields({ intake, className }: StarterIntakeFieldProps) {
  const { copy, roleLabel, goal } = useStarterIntakeLabels(intake)

  return (
    <dl className={cn('grid grid-cols-2 gap-2.5', className)}>
      <div className="rounded-[1rem] border border-border/60 bg-white/90 px-3.5 py-3">
        <dt className="text-xs font-medium text-muted-foreground">{copy.summaryRole}</dt>
        <dd className="mt-1.5 text-sm font-semibold text-foreground">{roleLabel}</dd>
      </div>
      <div className="rounded-[1rem] border border-border/60 bg-white/90 px-3.5 py-3">
        <dt className="text-xs font-medium text-muted-foreground">{copy.summaryGoal}</dt>
        <dd className="mt-1.5 text-sm font-semibold leading-snug text-foreground">{goal || '—'}</dd>
      </div>
    </dl>
  )
}

export function StarterIntakeConstraintField({ intake, className }: StarterIntakeFieldProps) {
  const { copy, constraintText } = useStarterIntakeLabels(intake)

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

/** @deprecated Use StarterIntakeTaskFields + StarterIntakeConstraintField */
export function StarterIntakeContextGrid({ intake, className }: StarterIntakeFieldProps) {
  return (
    <div className={className}>
      <StarterIntakeTaskFields intake={intake} />
      <StarterIntakeConstraintField intake={intake} className="mt-2.5" />
    </div>
  )
}
