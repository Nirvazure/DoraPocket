import { ExternalLink, FolderOpenDot, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MarketToolIcon } from '@/components/market/market-tool-icon'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { CandidateOriginBadge } from '@/components/discovery/candidate-origin-badge'
import {
  formatCandidateScore,
  shouldShowCandidateScore,
} from '@/components/discovery/candidate-score'
import {
  buildPrimaryRecommendation,
  isRecommendationCovered,
  isRecommendationRevealing,
  type AnalysisFlow,
} from '@/components/discovery/analysis-stage-content'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market-types'
import { STEP2_COPY } from '@/shared/ui-copy'
import type { ToolLookupFn } from '@/shared/tool-lookup'
import type { UserSettings } from '@/shared/user-settings'

type PrimaryRecommendationCardProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  analysisFlow: AnalysisFlow
  getTool: ToolLookupFn
  explanationMode?: UserSettings['explanationMode']
  onSaveCandidate: (toolId: string) => void
  onLaunchCandidate: (toolId: string) => void
  onOpenExternalCandidate: (url: string) => void
}

export function PrimaryRecommendationCard({
  payload,
  selectedToolPayload,
  analysisFlow,
  getTool,
  explanationMode = 'standard',
  onSaveCandidate,
  onLaunchCandidate,
  onOpenExternalCandidate,
}: PrimaryRecommendationCardProps) {
  const content = buildPrimaryRecommendation(payload, selectedToolPayload, getTool)
  const leader = content.leader
  const showScore = shouldShowCandidateScore(explanationMode) && leader != null
  const leaderToolId = leader?.toolId ?? null
  const leaderTool = getTool(leaderToolId)
  const leaderExternalUrl =
    leader?.candidateType === 'external_suggestion' ? (leader.url ?? null) : null
  const revealing = isRecommendationRevealing(analysisFlow)
  const covered = isRecommendationCovered(analysisFlow)

  if (covered) {
    return (
      <DisplayPanel className="relative overflow-hidden rounded-[2rem] border-sky-200/80 bg-white shadow-xl shadow-sky-900/8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.88))]"
          aria-hidden
        />
        <DisplayPanelHeader className="relative z-10 space-y-4 p-5 sm:p-6">
          <Badge className="w-fit border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
            <Sparkles className="h-3.5 w-3.5" />
            步骤 3 / 快掏出来了
          </Badge>
          <div className="space-y-3">
            <Skeleton className="h-4 w-32 bg-sky-100" />
            <Skeleton className="h-9 w-full max-w-md bg-sky-100" />
            <Skeleton className="h-4 w-4/5 bg-slate-200" />
          </div>
        </DisplayPanelHeader>
        <DisplayPanelContent className="relative z-10 grid gap-3 px-5 pb-6 pt-0 sm:px-6">
          <div className="rounded-2xl border border-white/90 bg-white/76 p-4 shadow-sm backdrop-blur">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24 bg-slate-200" />
                <Skeleton className="h-3 w-64 max-w-full bg-slate-200" />
              </div>
              <Skeleton className="h-10 w-28 rounded-full bg-sky-100" />
            </div>
          </div>
        </DisplayPanelContent>
      </DisplayPanel>
    )
  }

  return (
    <DisplayPanel className="relative overflow-hidden rounded-[2rem] border-primary/15 bg-slate-950 shadow-xl shadow-primary/5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(80,171,255,0.34),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_42%)]" />
      <DisplayPanelHeader className="relative z-10 space-y-4 p-5 text-white sm:p-6">
        <Badge className="w-fit border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/76">
          <Sparkles className="h-3.5 w-3.5" />
          步骤 3 / 正式出手
        </Badge>
        <div
          className={
            revealing
              ? 'animate-in fade-in flex items-start justify-between gap-4 duration-300'
              : 'flex items-start justify-between gap-4'
          }
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white/65">这次先用</p>
              {leader ? <CandidateOriginBadge candidate={leader} variant="on-dark" /> : null}
              {showScore ? (
                <Badge className="border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-white/76">
                  {formatCandidateScore(leader!)}
                </Badge>
              ) : null}
            </div>
            <DisplayPanelTitle className="mt-2 text-4xl leading-tight text-white sm:text-5xl">
              {content.title}
            </DisplayPanelTitle>
            <DisplayPanelDescription className="mt-4 max-w-3xl text-sm leading-7 text-white/76">
              {content.description}
            </DisplayPanelDescription>
            {leader?.candidateType === 'external_suggestion' && leader.externalBoundary ? (
              <p className="mt-3 max-w-3xl rounded-2xl border border-amber-200/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
                {leader.externalBoundary}
              </p>
            ) : null}
          </div>
          {leaderTool ? <MarketToolIcon tool={leaderTool} size="lg" /> : null}
        </div>
      </DisplayPanelHeader>
      <DisplayPanelContent className="relative z-10 flex flex-wrap gap-2 px-5 pb-6 pt-0 sm:px-6">
        {payload?.confidenceLevel === 'low' ? (
          <p className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {STEP2_COPY.lowConfidenceHint}
          </p>
        ) : null}
        {leaderExternalUrl ? (
          <Button
            type="button"
            className="h-11 rounded-full bg-white px-5 text-sm font-bold text-slate-950 hover:bg-white/90"
            onClick={() => onOpenExternalCandidate(leaderExternalUrl)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            打开外部工具
          </Button>
        ) : leaderToolId ? (
          <>
            <Button
              type="button"
              className="h-11 rounded-full bg-white px-5 text-sm font-bold text-slate-950 hover:bg-white/90"
              onClick={() => onLaunchCandidate(leaderToolId)}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              立即打开
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full border-white/25 bg-white/10 px-5 text-sm font-bold text-white hover:bg-white/16"
              onClick={() => onSaveCandidate(leaderToolId)}
            >
              <FolderOpenDot className="mr-2 h-4 w-4" />
              收进口袋
            </Button>
          </>
        ) : null}
      </DisplayPanelContent>
    </DisplayPanel>
  )
}
