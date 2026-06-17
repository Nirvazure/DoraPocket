import {
  isRecommendationCovered,
  isRecommendationRevealing,
  resolveAlternativeCandidates,
  type AnalysisFlow,
} from '@/shared/analysis-stage-content'
import { CandidateMatchScore } from '@/components/discovery/candidate-match-score'
import { CandidateOriginBadge } from '@/components/discovery/candidate-origin-badge'
import { shouldShowCandidateScore } from '@/components/discovery/candidate-score'
import { MarketToolIcon } from '@/components/market/market-tool-icon'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ToolLookupFn } from '@/shared/tool-lookup'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market-types'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserSettings } from '@/shared/user-settings'
import { cn } from '@/lib/utils'

const ALTERNATIVE_SLOT_LABELS = ['A', 'B', 'C'] as const

type CandidateAlternativesCardProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  analysisFlow: AnalysisFlow
  getTool: ToolLookupFn
  explanationMode?: UserSettings['explanationMode']
  onOpenExternalCandidate?: (url: string) => void
}

function AlternativeCardSkeleton() {
  return (
    <div className="dp-gadget-alt-card flex flex-col p-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-10 bg-primary/10" />
        <Skeleton className="h-7 w-14 rounded-full bg-primary/10" />
      </div>
      <div className="mt-3 flex gap-2.5">
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl bg-slate-100" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-full bg-slate-200" />
          <Skeleton className="h-3 w-4/5 bg-slate-200" />
        </div>
      </div>
    </div>
  )
}

export function CandidateAlternativesCard({
  payload,
  selectedToolPayload,
  analysisFlow,
  getTool,
  explanationMode = 'standard',
  onOpenExternalCandidate,
}: CandidateAlternativesCardProps) {
  const alternatives = resolveAlternativeCandidates(payload, selectedToolPayload)
  const showScore = shouldShowCandidateScore(explanationMode)
  const covered = isRecommendationCovered(analysisFlow)
  const revealing = isRecommendationRevealing(analysisFlow)

  if (covered) {
    return (
      <div className="grid w-full gap-2.5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <AlternativeCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('w-full', revealing && 'animate-in fade-in duration-300')}>
      {alternatives.length > 0 ? (
        <div className="grid gap-2.5 md:grid-cols-3">
          {alternatives.map((candidate, index) => {
            const tool = candidate.toolId ? getTool(candidate.toolId) : null
            const isExternal = candidate.candidateType === 'external_suggestion'
            const slotLabel = ALTERNATIVE_SLOT_LABELS[index] ?? String(index + 1)
            const displayName = tool?.name ?? candidate.title
            const notFirstReason =
              payload?.whyNotAlternatives?.[candidate.toolId ?? candidate.title] ?? candidate.reason

            return (
              <article
                key={candidate.toolId ?? `${candidate.title}-${index}`}
                className="dp-gadget-alt-card flex h-full flex-col p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full border border-primary/12 bg-primary/[0.06] px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary/75">
                    备选 {slotLabel}
                  </span>
                  {showScore ? (
                    <CandidateMatchScore candidate={candidate} layout="chip" className="shrink-0" />
                  ) : null}
                </div>

                <div className="mt-3 flex items-start gap-2.5">
                  {tool ? (
                    <MarketToolIcon tool={tool} size="sm" />
                  ) : (
                    <div
                      className="dp-gadget-alt-icon flex items-center justify-center text-lg"
                      aria-hidden
                    >
                      🌐
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold leading-snug text-foreground">
                      {displayName}
                    </h3>
                    <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
                      {candidate.reason}
                    </p>
                    <p className="mt-2 rounded-lg bg-slate-100 px-2 py-1.5 text-[10px] font-semibold leading-relaxed text-slate-600">
                      暂不首选：{notFirstReason}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-1.5 pt-3">
                  <CandidateOriginBadge candidate={candidate} />
                  {isExternal && candidate.externalBoundary ? (
                    <p className="text-[10px] leading-relaxed text-amber-800/75">
                      {candidate.externalBoundary}
                    </p>
                  ) : null}
                  {isExternal && candidate.url && onOpenExternalCandidate ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 w-full rounded-full border-primary/15 bg-white/80 px-2.5 text-[10px] font-bold text-primary hover:bg-white"
                      onClick={() => onOpenExternalCandidate(candidate.url ?? '')}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      打开外部工具
                    </Button>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-primary/15 bg-white/50 px-4 py-3 text-center text-xs font-medium text-muted-foreground">
          当前备选已压缩到最小集合，先试主推荐即可。
        </div>
      )}
    </div>
  )
}
