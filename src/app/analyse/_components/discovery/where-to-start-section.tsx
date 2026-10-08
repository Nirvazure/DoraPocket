'use client'

import { CheckCircle2, Globe2, Library, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PAGE_COPY } from '@/shared/copy/ui-copy'
import { STARTER_PROMPT_TEMPLATES } from '@/shared/discovery/starter-intake'
import { Button } from '@/components/ui/button'
import type { RecommendationMode } from '@/shared/discovery/recommendation-mode'
import {
  RECOMMENDATION_LIMIT_OPTIONS,
  normalizeRecommendationPreferences,
  type RecommendationPreferences,
} from '@/shared/discovery/recommendation-preferences'

type WhereToStartSectionProps = {
  actionsEnabled?: boolean
  wizardDisabled?: boolean
  naturalDescription: string
  onNaturalDescriptionChange: (value: string) => void
  onAnalyze: () => void
  recommendationMode: RecommendationMode
  onRecommendationModeChange: (mode: RecommendationMode) => void
  recommendationPreferences: RecommendationPreferences
  onRecommendationPreferencesChange: (preferences: RecommendationPreferences) => void
}

export function WhereToStartSection({
  actionsEnabled = true,
  wizardDisabled,
  naturalDescription,
  onNaturalDescriptionChange,
  onAnalyze,
  recommendationMode,
  onRecommendationModeChange,
  recommendationPreferences,
  onRecommendationPreferencesChange,
}: WhereToStartSectionProps) {
  const copy = PAGE_COPY.analysis.starter
  const preferences = normalizeRecommendationPreferences(recommendationPreferences)
  const settingsDisabled = wizardDisabled || !actionsEnabled
  const optionClassName =
    'h-8 min-w-0 gap-1.5 rounded-full px-2 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed'
  const selectedClassName =
    'border-primary/25 bg-primary/[0.06] text-primary hover:bg-primary/10 hover:text-primary'

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

      <div className="shrink-0 border-y border-border/60 py-3 sm:grid sm:grid-cols-2 sm:gap-x-3 sm:[&>div:first-child]:col-span-2 sm:[&>div:last-child]:col-start-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] sm:items-stretch sm:gap-0">
          <div className="min-w-0 sm:pr-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold text-foreground">推荐范围</p>
            </div>
            <div
              className="mt-1.5 grid grid-cols-2 gap-1 rounded-full border border-border/60 bg-white/70 p-0.5"
              role="group"
              aria-label="推荐范围"
            >
              {(
                [
                  ['market', '仅找库中', Library],
                  ['web', '混合模式', Globe2],
                ] as const
              ).map(([value, label, Icon]) => {
                const selected = recommendationMode === value
                return (
                  <Button
                    key={value}
                    type="button"
                    variant="ghost"
                    disabled={settingsDisabled}
                    aria-pressed={selected}
                    onClick={() => onRecommendationModeChange(value)}
                    className={cn(
                      optionClassName,
                      selected ? selectedClassName : 'text-muted-foreground hover:bg-white/70',
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="hidden bg-border/60 sm:block" aria-hidden="true" />
          <div className="min-w-0 sm:pl-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-bold text-foreground">推荐数量</p>
            </div>
            <div
              className="mt-1.5 grid grid-cols-3 gap-1 rounded-full border border-border/60 bg-white/70 p-0.5"
              role="group"
              aria-label="推荐数量"
            >
              {RECOMMENDATION_LIMIT_OPTIONS.map((limit) => {
                const selected = preferences.recommendationLimit === limit
                return (
                  <Button
                    key={limit}
                    type="button"
                    variant="ghost"
                    disabled={settingsDisabled}
                    aria-pressed={selected}
                    onClick={() =>
                      onRecommendationPreferencesChange(
                        normalizeRecommendationPreferences({ recommendationLimit: limit }),
                      )
                    }
                    className={cn(
                      optionClassName,
                      'tabular-nums',
                      selected ? selectedClassName : 'text-muted-foreground hover:bg-white/70',
                    )}
                  >
                    {limit} 个
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="mt-2.5 flex min-h-7 items-center justify-between gap-3 border-t border-border/45 pt-2">
          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Target className="size-3.5" aria-hidden />
            最低匹配度
          </span>
          <output
            aria-label="最低匹配度"
            aria-live="polite"
            aria-atomic="true"
            className="w-14 shrink-0 text-right text-lg font-bold leading-none tabular-nums text-primary"
          >
            {preferences.minMatchScore}
            <span className="ml-0.5 text-xs">%</span>
          </output>
        </div>
      </div>

      {!actionsEnabled ? (
        <div className="shrink-0">
          <p className="text-sm text-muted-foreground">{copy.actionsDisabledHint}</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <section className="min-h-0">
            <div className="grid gap-2.5 lg:grid-cols-3">
              {STARTER_PROMPT_TEMPLATES.map((template) => {
                const selected = naturalDescription === template.prompt

                return (
                  <button
                    key={template.id}
                    type="button"
                    disabled={wizardDisabled}
                    aria-pressed={selected}
                    onClick={() => onNaturalDescriptionChange(template.prompt)}
                    className={cn(
                      'rounded-[1.15rem] border p-3 text-left transition-[background-color,border-color,box-shadow] hover:border-primary/25 hover:bg-primary/[0.03]',
                      selected
                        ? 'border-primary/40 bg-primary/[0.06] shadow-[0_10px_24px_-18px_hsl(var(--primary)/0.65)] ring-1 ring-primary/20'
                        : 'border-border/70 bg-white',
                      wizardDisabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-foreground">{template.title}</span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                          selected
                            ? 'border-primary/25 bg-primary text-primary-foreground'
                            : 'border-primary/15 bg-primary/[0.06] text-primary',
                        )}
                      >
                        {selected ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : null}
                        {selected ? '已套用' : copy.templateUseAction}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {template.description}
                    </span>
                    <span className="mt-2 block text-xs leading-relaxed text-foreground/80">
                      {template.prompt}
                    </span>
                  </button>
                )
              })}
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
            onKeyDown={(event) => {
              if (
                event.key !== 'Enter' ||
                event.shiftKey ||
                event.nativeEvent.isComposing ||
                wizardDisabled ||
                !actionsEnabled ||
                naturalDescription.trim().length < 4
              ) {
                return
              }

              event.preventDefault()
              onAnalyze()
            }}
          />
        </div>
      )}
    </section>
  )
}
