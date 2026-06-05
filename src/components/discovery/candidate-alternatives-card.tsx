import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import {
  isRecommendationCovered,
  isRecommendationRevealing,
  resolveAlternativeCandidates,
  type AnalysisFlow,
} from '@/components/discovery/analysis-stage-content'
import { CandidateOriginBadge } from '@/components/discovery/candidate-origin-badge'
import {
  formatCandidateScore,
  shouldShowCandidateScore,
} from '@/components/discovery/candidate-score'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ToolLookupFn } from '@/shared/tool-lookup'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market-types'

import { Skeleton } from '@/components/ui/skeleton'
import type { UserSettings } from '@/shared/user-settings'

type CandidateAlternativesCardProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  analysisFlow: AnalysisFlow
  getTool: ToolLookupFn
  explanationMode?: UserSettings['explanationMode']
  onOpenExternalCandidate?: (url: string) => void
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
      <DisplayPanel className="rounded-[1.8rem] border-border/70 bg-white shadow-sm">
        <DisplayPanelHeader className="space-y-2">
          <Skeleton className="h-3 w-28 bg-slate-200" />
          <Skeleton className="h-7 w-56 max-w-full bg-slate-200" />
        </DisplayPanelHeader>
        <DisplayPanelContent>
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <DisplayPanel
                key={index}
                className="rounded-2xl border-border/60 bg-slate-50 p-3 shadow-none"
              >
                <Skeleton className="h-4 w-32 bg-slate-200" />
                <Skeleton className="mt-2 h-3 w-full bg-slate-200" />
                <Skeleton className="mt-2 h-3 w-4/5 bg-slate-200" />
              </DisplayPanel>
            ))}
          </div>
        </DisplayPanelContent>
      </DisplayPanel>
    )
  }

  return (
    <DisplayPanel className="rounded-[1.8rem] border-border/70 bg-white shadow-sm">
      <DisplayPanelHeader className="space-y-2">
        <DisplayPanelTitle className="text-xl text-foreground">
          如果你不想用这个，还有这些
        </DisplayPanelTitle>
      </DisplayPanelHeader>
      <DisplayPanelContent className={revealing ? 'animate-in fade-in duration-300' : undefined}>
        {alternatives.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {alternatives.map((candidate, index) => {
              const tool = candidate.toolId ? getTool(candidate.toolId) : null
              const isExternal = candidate.candidateType === 'external_suggestion'
              return (
                <DisplayPanel
                  key={candidate.toolId ?? `${candidate.title}-${index}`}
                  className="rounded-2xl border-border/60 bg-slate-50 p-3 shadow-none"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-xs font-black text-foreground">
                      备选 {index + 1} · {tool?.name ?? candidate.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {showScore ? (
                        <Badge
                          variant="outline"
                          className="border-border/55 bg-white px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                        >
                          {formatCandidateScore(candidate)}
                        </Badge>
                      ) : null}
                      <CandidateOriginBadge candidate={candidate} />
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    {candidate.reason}
                  </p>
                  {isExternal && candidate.externalBoundary ? (
                    <p className="mt-2 text-[10px] leading-relaxed text-amber-800/80">
                      {candidate.externalBoundary}
                    </p>
                  ) : null}
                  {isExternal && candidate.url && onOpenExternalCandidate ? (
                    <Button
                      type="button"
                      size="sm"
                      className="mt-3 h-8 rounded-full px-3 text-[11px]"
                      onClick={() => onOpenExternalCandidate(candidate.url ?? '')}
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      打开外部工具
                    </Button>
                  ) : null}
                </DisplayPanel>
              )
            })}
          </div>
        ) : (
          <DisplayPanel className="rounded-2xl border-dashed bg-slate-50 p-4 text-center text-xs font-semibold text-muted-foreground shadow-none">
            当前备选已压缩到最小集合，先试主推荐即可。
          </DisplayPanel>
        )}
      </DisplayPanelContent>
    </DisplayPanel>
  )
}
