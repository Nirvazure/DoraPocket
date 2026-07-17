'use client'

import { cn } from '@/lib/utils'
import { PAGE_COPY } from '@/shared/copy/ui-copy'
import { STARTER_PROMPT_TEMPLATES } from '@/shared/discovery/starter-intake'

type WhereToStartSectionProps = {
  actionsEnabled?: boolean
  wizardDisabled?: boolean
  naturalDescription: string
  onNaturalDescriptionChange: (value: string) => void
}

export function WhereToStartSection({
  actionsEnabled = true,
  wizardDisabled,
  naturalDescription,
  onNaturalDescriptionChange,
}: WhereToStartSectionProps) {
  const copy = PAGE_COPY.analysis.starter

  return (
    <section className="flex min-h-full w-full flex-1 flex-col gap-5">
      <div className="shrink-0">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/80">
          TELL DORA WHAT YOU NEED
        </p>
        <p className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
          {copy.naturalDraftTitle}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground/85">
          {copy.naturalDraftHint}
        </p>
      </div>

      {!actionsEnabled ? (
        <div className="shrink-0">
          <p className="text-sm text-muted-foreground">{copy.actionsDisabledHint}</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <section className="min-h-0">
            <div className="grid gap-2.5 lg:grid-cols-3">
              {STARTER_PROMPT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  disabled={wizardDisabled}
                  onClick={() => onNaturalDescriptionChange(template.prompt)}
                  className={cn(
                    'rounded-[1.15rem] border border-border/70 bg-white p-3 text-left transition-colors hover:border-primary/25 hover:bg-primary/[0.03]',
                    wizardDisabled && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-foreground">{template.title}</span>
                    <span className="rounded-full border border-primary/15 bg-primary/[0.06] px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {copy.templateUseAction}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {template.description}
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-foreground/80">
                    {template.prompt}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <textarea
            value={naturalDescription}
            disabled={wizardDisabled}
            rows={5}
            aria-label={copy.naturalDraftTitle}
            placeholder={copy.naturalDraftPlaceholder}
            className={cn(
              'min-h-[14rem] w-full flex-1 resize-none rounded-[1.35rem] border border-border/70 bg-white px-4 py-3.5 font-sans text-base leading-7 text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus-visible:ring-2',
              wizardDisabled && 'cursor-not-allowed opacity-50',
            )}
            onChange={(event) => onNaturalDescriptionChange(event.target.value)}
          />
        </div>
      )}
    </section>
  )
}
