'use client'

import { CheckCircle2, Globe2, Library, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PAGE_COPY } from '@/shared/copy/ui-copy'
import { STARTER_PROMPT_TEMPLATES } from '@/shared/discovery/starter-intake'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { RecommendationMode } from '@/shared/discovery/recommendation-mode'
import {
  RECOMMENDATION_LIMIT_OPTIONS,
  type RecommendationLimit,
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

      <div className="shrink-0 rounded-[1.15rem] border border-border/70 bg-white p-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-black text-foreground">
              <Search className="h-4 w-4 text-primary" aria-hidden />
              推荐范围
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">本次有效</p>
            <div
              className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-border/70 bg-muted/35 p-1"
              role="group"
              aria-label="推荐范围"
            >
              {(
                [
                  ['market', '库里找', Library],
                  ['web', '全网找', Globe2],
                ] as const
              ).map(([value, label, Icon]) => {
                const selected = recommendationMode === value
                return (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={selected ? 'default' : 'ghost'}
                    disabled={wizardDisabled || !actionsEnabled}
                    aria-pressed={selected}
                    onClick={() => onRecommendationModeChange(value)}
                    className="min-w-0 gap-1 px-1.5 text-[11px] font-black"
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {label}
                  </Button>
                )
              })}
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-black text-foreground">推荐数量</p>
            <p className="mt-0.5 text-xs text-muted-foreground">包含主推荐</p>
            <div
              className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-border/70 bg-muted/35 p-1"
              role="group"
              aria-label="推荐数量"
            >
              {RECOMMENDATION_LIMIT_OPTIONS.map((limit) => {
                const selected = recommendationPreferences.recommendationLimit === limit
                return (
                  <Button
                    key={limit}
                    type="button"
                    size="sm"
                    variant={selected ? 'default' : 'ghost'}
                    disabled={wizardDisabled || !actionsEnabled}
                    aria-pressed={selected}
                    onClick={() =>
                      onRecommendationPreferencesChange({
                        ...recommendationPreferences,
                        recommendationLimit: limit as RecommendationLimit,
                      })
                    }
                    className="min-w-0 px-1 text-[11px] font-black"
                  >
                    {limit} 个
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 rounded-[1.15rem] border border-border/70 bg-white p-3">
        <div className="flex items-center justify-between gap-3 text-sm font-black text-foreground">
          <span>最低匹配度</span>
          <span className="tabular-nums text-primary">
            {recommendationPreferences.minMatchScore}%
          </span>
        </div>
        <Slider
          min={0}
          max={100}
          step={5}
          value={recommendationPreferences.minMatchScore}
          disabled={wizardDisabled || !actionsEnabled}
          getAriaLabel={() => '最低匹配度'}
          getAriaValueText={(value) => `${value}%`}
          onValueChange={(value) =>
            onRecommendationPreferencesChange({
              ...recommendationPreferences,
              minMatchScore: Number(value),
            })
          }
          className="mt-3"
        />
        <p className="mt-2 text-[11px] text-muted-foreground">
          只展示达到此匹配度的候选，按本次首选相对折算
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
