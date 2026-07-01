'use client'

import { cn } from '@/lib/utils'
import { STARTER_ROLES, type StarterIntake, type StarterRoleId } from '@/shared/starter-intake'
import { PAGE_COPY } from '@/shared/ui-copy'

type StarterRoleStepProps = {
  intake: StarterIntake
  disabled?: boolean
  onSelectRole: (roleId: StarterRoleId) => void
}

export function StarterRoleStep({ intake, disabled, onSelectRole }: StarterRoleStepProps) {
  const copy = PAGE_COPY.analysis.starter

  return (
    <div className="space-y-3">
      <div>
        <p className="text-lg font-black text-foreground sm:text-xl">{copy.step1Title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.step1Hint}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {STARTER_ROLES.map((role) => {
          const selected = intake.roleId === role.id
          return (
            <button
              key={role.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onSelectRole(role.id)}
              className={cn(
                'rounded-[1.2rem] border p-3 text-left transition-colors sm:p-4',
                selected
                  ? 'border-primary bg-primary/[0.1] ring-1 ring-primary/25'
                  : 'border-border/70 bg-white hover:border-primary/25 hover:bg-primary/[0.03]',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <span className="text-xl leading-none" aria-hidden>
                {role.emoji}
              </span>
              <span className="mt-2 block text-xs font-black leading-snug text-foreground sm:text-sm">
                {role.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
