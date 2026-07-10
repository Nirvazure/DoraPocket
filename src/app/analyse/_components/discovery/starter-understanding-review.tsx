'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { StarterConstraintStep } from '@/app/analyse/_components/discovery/starter-wizard/starter-constraint-step'
import { StarterOutcomeStep } from '@/app/analyse/_components/discovery/starter-wizard/starter-outcome-step'
import { StarterRoleStep } from '@/app/analyse/_components/discovery/starter-wizard/starter-role-step'
import { StarterIntakeConstraintField } from '@/app/analyse/_components/discovery/starter-wizard/starter-intake-summary'
import { cn } from '@/lib/utils'
import { PAGE_COPY } from '@/shared/copy/ui-copy'
import { STARTER_ROLES, type StarterIntentStatus } from '@/shared/discovery/starter-intake'
import type {
  StarterConstraintId,
  StarterIntake,
  StarterOutcomeId,
  StarterRoleId,
} from '@/shared/discovery/starter-intake'

type EditPanel = 'role' | 'goal' | 'constraints' | null

type StarterUnderstandingReviewProps = {
  intake: StarterIntake
  sourceText: string
  intentStatus?: StarterIntentStatus
  intentNote?: string
  disabled?: boolean
  onSelectRole: (roleId: StarterRoleId) => void
  onSelectOutcome: (outcomeId: StarterOutcomeId) => void
  onToggleConstraint: (constraintId: StarterConstraintId) => void
  onCustomTaskChange: (value: string) => void
}

function UnderstandingSection({
  title,
  action,
  active,
  disabled,
  onToggle,
  children,
}: {
  title: string
  action: string
  active: boolean
  disabled?: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const copy = PAGE_COPY.analysis.starter
  return (
    <section
      className={cn(
        'rounded-[1.35rem] border bg-white/95 p-3 transition-colors sm:p-4',
        active ? 'border-primary/25 ring-1 ring-primary/15' : 'border-border/70',
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-black text-foreground">{title}</p>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onToggle}>
          {active ? copy.confirmEditAction : action}
        </Button>
      </div>
      {children}
    </section>
  )
}

export function StarterUnderstandingReview({
  intake,
  sourceText,
  intentStatus = 'ready',
  intentNote = '',
  disabled = false,
  onSelectRole,
  onSelectOutcome,
  onToggleConstraint,
  onCustomTaskChange,
}: StarterUnderstandingReviewProps) {
  const [editing, setEditing] = useState<EditPanel>(null)
  const copy = PAGE_COPY.analysis.starter
  const roleLabel =
    STARTER_ROLES.find((role) => role.id === intake.roleId)?.label ?? copy.roleUnspecified
  const note = intentNote || (intentStatus === 'fallback' ? copy.draftFallbackHint : '')

  const toggleEditing = (panel: Exclude<EditPanel, null>) => {
    setEditing((current) => (current === panel ? null : panel))
  }

  return (
    <section className="flex min-h-full flex-col gap-3">
      <div className="rounded-[1.35rem] border border-primary/18 bg-primary/[0.04] p-3 sm:p-4">
        <p className="text-xl font-black text-foreground sm:text-2xl">{copy.reviewTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy.reviewHint}</p>
        {note ? (
          <p className="mt-2 rounded-full border border-primary/15 bg-white/75 px-3 py-1.5 text-xs font-semibold text-primary">
            {note}
          </p>
        ) : null}

        <div className="mt-3 rounded-[1rem] border border-border/60 bg-white/80 px-3.5 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            {copy.naturalDraftSourceLabel}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">{sourceText}</p>
        </div>
      </div>

      <UnderstandingSection
        title={copy.summaryRole}
        action={copy.editRoleAction}
        active={editing === 'role'}
        disabled={disabled}
        onToggle={() => toggleEditing('role')}
      >
        {editing === 'role' ? (
          <StarterRoleStep intake={intake} disabled={disabled} onSelectRole={onSelectRole} />
        ) : (
          <div className="rounded-[1rem] border border-border/60 bg-slate-50/80 px-3.5 py-3">
            <p className="text-xs font-medium text-muted-foreground">{copy.summaryRole}</p>
            <p className="mt-1.5 text-sm font-semibold text-foreground">{roleLabel}</p>
          </div>
        )}
      </UnderstandingSection>

      <UnderstandingSection
        title={copy.summaryGoal}
        action={copy.editGoalAction}
        active={editing === 'goal'}
        disabled={disabled}
        onToggle={() => toggleEditing('goal')}
      >
        <textarea
          value={intake.customTask}
          disabled={disabled}
          rows={4}
          aria-label={copy.dockTaskLabel}
          placeholder={copy.customTaskPlaceholder}
          className={cn(
            'w-full resize-none rounded-2xl border border-border/70 bg-slate-50/80 px-3 py-2.5 font-sans text-sm leading-6 text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus-visible:ring-2',
            disabled && 'cursor-not-allowed opacity-50',
          )}
          onChange={(event) => onCustomTaskChange(event.target.value)}
        />
        {editing === 'goal' ? (
          <div className="mt-3">
            <StarterOutcomeStep
              intake={intake}
              disabled={disabled}
              onSelectOutcome={onSelectOutcome}
            />
          </div>
        ) : null}
      </UnderstandingSection>

      <UnderstandingSection
        title={copy.summaryConstraints}
        action={copy.editConstraintsAction}
        active={editing === 'constraints'}
        disabled={disabled}
        onToggle={() => toggleEditing('constraints')}
      >
        {editing === 'constraints' ? (
          <StarterConstraintStep
            intake={intake}
            disabled={disabled}
            onToggleConstraint={onToggleConstraint}
          />
        ) : (
          <StarterIntakeConstraintField intake={intake} />
        )}
      </UnderstandingSection>
    </section>
  )
}
