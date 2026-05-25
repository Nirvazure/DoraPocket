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
import { Skeleton } from '@/components/ui/skeleton'
import { getToolById } from '@/shared/tool-registry'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market-types'

type CandidateAlternativesCardProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  analysisFlow: AnalysisFlow
}

export function CandidateAlternativesCard({
  payload,
  selectedToolPayload,
  analysisFlow,
}: CandidateAlternativesCardProps) {
  const alternatives = resolveAlternativeCandidates(payload, selectedToolPayload)
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
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          本次出手里的备选
        </p>
        <DisplayPanelTitle className="text-xl text-foreground">
          如果你不想用这个，还有这些
        </DisplayPanelTitle>
      </DisplayPanelHeader>
      <DisplayPanelContent className={revealing ? 'animate-in fade-in duration-300' : undefined}>
        {alternatives.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {alternatives.map((candidate, index) => {
              const tool = candidate.toolId ? getToolById(candidate.toolId) : null
              return (
                <DisplayPanel
                  key={candidate.toolId ?? `${candidate.title}-${index}`}
                  className="rounded-2xl border-border/60 bg-slate-50 p-3 shadow-none"
                >
                  <p className="text-xs font-black text-foreground">
                    备选 {index + 1} · {tool?.name ?? candidate.title}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    {candidate.reason}
                  </p>
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
