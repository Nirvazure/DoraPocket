'use client'

import { GitBranch } from 'lucide-react'
import { StarterWizardContent } from '@/components/discovery/starter-wizard/starter-wizard-content'
import { DisplayPanel, DisplayPanelContent } from '@/components/ui/display-shell'
import { PAGE_COPY } from '@/shared/ui-copy'
import type { StarterIntake, StarterWizardStep } from '@/shared/starter-intake'
import type { StarterWizardContentProps } from '@/components/discovery/starter-wizard/starter-wizard-content'

const THINKING_STEPS = [
  {
    title: '先理解处境',
    body: 'DoraPocket 会先看这次任务的目标、限制、时间压力和开始门槛。',
  },
  {
    title: '再收束候选',
    body: '从很多工具和路径里排掉此刻不合适的，把注意力留给少数可行动方案。',
  },
  {
    title: '最后给出裁决',
    body: '先给结论，再给理由，再给下一步动作，不让你继续研究一堆选项。',
  },
]

type WhereToStartSectionProps = {
  actionsEnabled?: boolean
  wizardStep: StarterWizardStep
  intake: StarterIntake
  wizardDisabled?: boolean
  onSelectRole: StarterWizardContentProps['onSelectRole']
  onSelectOutcome: StarterWizardContentProps['onSelectOutcome']
  onToggleConstraint: StarterWizardContentProps['onToggleConstraint']
  onCustomTaskChange: StarterWizardContentProps['onCustomTaskChange']
}

export function WhereToStartSection({
  actionsEnabled = true,
  wizardStep,
  intake,
  wizardDisabled,
  onSelectRole,
  onSelectOutcome,
  onToggleConstraint,
  onCustomTaskChange,
}: WhereToStartSectionProps) {
  const copy = PAGE_COPY.analysis.starter

  return (
    <div className="flex min-h-full flex-col gap-3">
      <section className="flex min-h-0 flex-1 flex-col rounded-[1.8rem] border border-primary/15 bg-primary/[0.04] p-4">
        <div className="shrink-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            {copy.wizardEyebrow}
          </p>
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
              onCustomTaskChange={onCustomTaskChange}
            />
          </div>
        )}
      </section>

      <DisplayPanel className="shrink-0 rounded-[1.8rem] border-border/70 bg-white shadow-sm">
        <DisplayPanelContent className="p-4 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-primary">
              <GitBranch className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-black text-foreground">DoraPocket 会怎么开始思考</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                它不是把工具海倒给你，而是先把这次该怎么出手收束清楚。
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {THINKING_STEPS.map((step, index) => (
              <div key={step.title} className="grid gap-3 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/[0.1] text-[11px] font-black text-primary">
                    0{index + 1}
                  </span>
                  <span className="text-xs font-black text-foreground">{step.title}</span>
                </div>
                <div className="relative border-l border-primary/20 pl-4 sm:border-l-0 sm:pl-0">
                  <div className="hidden sm:block absolute left-[-0.75rem] top-3 h-px w-2 bg-primary/25" />
                  <p className="text-sm leading-7 text-muted-foreground">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </DisplayPanelContent>
      </DisplayPanel>
    </div>
  )
}
