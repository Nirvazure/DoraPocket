import { Check, Loader2 } from 'lucide-react'
import {
  buildLiveAnalysisTrack,
  type AnalysisFlow,
  type LiveAnalysisTrackItem,
} from '@/shared/analysis-stage-content'
import { cn } from '@/lib/utils'
import type { AgentUiPayload } from '@/shared/market-types'
import type { ProgressStage } from '@/shared/step2-session-types'
import type { StarterIntake } from '@/shared/starter-intake'
import {
  StarterIntakeConstraintField,
  StarterIntakeTaskFields,
} from '@/app/analyse/_components/discovery/starter-wizard/starter-intake-summary'
import { PAGE_COPY } from '@/shared/ui-copy'
import type { AppState } from '@/store'

type LiveAnalysisTrackCardProps = {
  currentPrompt: string | null
  payload: AgentUiPayload | null
  appState: AppState
  analysisFlow: AnalysisFlow
  progressStage?: ProgressStage | null
  starterIntake?: StarterIntake | null
}

function TrackIcon({ item }: { item: LiveAnalysisTrackItem }) {
  if (item.status === 'active') {
    return <Loader2 className="h-4 w-4 animate-spin" />
  }
  if (item.status === 'done') {
    return <Check className="h-4 w-4" />
  }
  return <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
}

export function LiveAnalysisTrackCard({
  currentPrompt,
  payload,
  appState,
  analysisFlow,
  progressStage = null,
  starterIntake = null,
}: LiveAnalysisTrackCardProps) {
  const items = buildLiveAnalysisTrack({
    currentPrompt,
    payload,
    appState,
    analysisFlow,
    progressStage,
  })

  const starterCopy = PAGE_COPY.analysis.starter

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={`track-${index}-${item.title}`}
          className={cn(
            'relative rounded-[1.35rem] border p-4 transition-colors',
            item.status === 'active'
              ? 'border-primary/25 bg-primary/[0.05]'
              : item.status === 'done'
                ? 'border-primary/15 bg-white'
                : 'border-border/60 bg-slate-50/80',
          )}
        >
          {index < items.length - 1 ? (
            <span className="absolute bottom-[-0.85rem] left-8 h-3 w-px bg-border" aria-hidden />
          ) : null}
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl',
                item.status === 'active'
                  ? 'bg-primary text-primary-foreground'
                  : item.status === 'done'
                    ? 'bg-primary/[0.12] text-primary'
                    : 'bg-slate-100 text-muted-foreground',
              )}
            >
              <TrackIcon item={item} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-foreground">{item.title}</p>
              {index === 0 && starterIntake ? (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {starterCopy.intakeSummaryHint}
                </p>
              ) : null}
              <p className="mt-1 text-sm leading-7 text-muted-foreground">{item.detail}</p>
              {index === 0 && starterIntake ? (
                <StarterIntakeTaskFields intake={starterIntake} className="mt-3" />
              ) : null}
              {index === 1 && starterIntake ? (
                <StarterIntakeConstraintField intake={starterIntake} className="mt-3" />
              ) : null}
              {item.meta ? (
                <p className="mt-2 rounded-2xl border border-border/60 bg-white/80 px-3 py-2 text-xs font-semibold text-foreground/75">
                  {item.meta}
                </p>
              ) : null}
              {item.tags && item.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.tags.map((tag, tagIndex) => (
                    <span
                      key={`${index}-${tagIndex}-${tag}`}
                      className="rounded-full border border-primary/15 bg-primary/[0.06] px-2.5 py-1 text-[11px] font-semibold text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
