'use client'

import { StarterWizardContent } from '@/app/analyse/_components/discovery/starter-wizard/starter-wizard-content'
import { SectionLabel } from '@/components/ui/section-label'
import { PAGE_COPY } from '@/shared/copy/ui-copy'
import type { StarterIntake, StarterWizardStep } from '@/shared/discovery/starter-intake'
import type { StarterWizardContentProps } from '@/app/analyse/_components/discovery/starter-wizard/starter-wizard-content'

type WhereToStartSectionProps = {
  actionsEnabled?: boolean
  wizardStep: StarterWizardStep
  intake: StarterIntake
  wizardDisabled?: boolean
  onSelectRole: StarterWizardContentProps['onSelectRole']
  onSelectOutcome: StarterWizardContentProps['onSelectOutcome']
  onToggleConstraint: StarterWizardContentProps['onToggleConstraint']
}

export function WhereToStartSection({
  actionsEnabled = true,
  wizardStep,
  intake,
  wizardDisabled,
  onSelectRole,
  onSelectOutcome,
  onToggleConstraint,
}: WhereToStartSectionProps) {
  const copy = PAGE_COPY.analysis.starter

  return (
    <section className="flex min-h-full w-full flex-1 flex-col">
      <div className="shrink-0">
        <SectionLabel>{copy.wizardEyebrow}</SectionLabel>
      </div>

      {!actionsEnabled ? (
        <div className="mt-3 shrink-0">
          <p className="text-sm text-muted-foreground">{copy.actionsDisabledHint}</p>
        </div>
      ) : (
        <div className="mt-3 min-h-0 flex-1">
          <StarterWizardContent
            wizardStep={wizardStep}
            intake={intake}
            disabled={wizardDisabled}
            onSelectRole={onSelectRole}
            onSelectOutcome={onSelectOutcome}
            onToggleConstraint={onToggleConstraint}
          />
        </div>
      )}
    </section>
  )
}
