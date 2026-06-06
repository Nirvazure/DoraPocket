import { ExternalLink, FolderOpenDot } from 'lucide-react'
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
import { CandidateMatchScore } from '@/components/discovery/candidate-match-score'
import { CandidateOriginBadge } from '@/components/discovery/candidate-origin-badge'
import { shouldShowCandidateScore } from '@/components/discovery/candidate-score'
import {
  buildPrimaryRecommendation,
  isRecommendationCovered,
  isRecommendationRevealing,
  type AnalysisFlow,
} from '@/shared/analysis-stage-content'
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
      <DisplayPanel className="relative w-full overflow-hidden rounded-2xl border-sky-200/80 bg-white shadow-xl shadow-sky-900/8">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(240,249,255,0.88))]"
          aria-hidden
        />
        <DisplayPanelHeader className="relative overflow-hidden p-5 sm:p-6">
          <Skeleton
            className="pointer-events-none absolute -right-8 top-1/2 h-48 w-48 -translate-y-1/2 rounded-[2rem] bg-sky-100/60 sm:h-56 sm:w-56"
            aria-hidden
          />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0 max-w-[68%] space-y-3 sm:max-w-[62%]">
              <div className="flex flex-wrap items-end gap-3">
                <Skeleton className="h-9 w-40 bg-sky-100" />
                <Skeleton className="mb-1 h-5 w-24 rounded-full bg-slate-200" />
              </div>
              <Skeleton className="h-4 w-4/5 bg-slate-200" />
            </div>
            <Skeleton className="h-[4.5rem] w-[4.25rem] shrink-0 rounded-2xl bg-sky-100" />
          </div>
        </DisplayPanelHeader>
        <DisplayPanelContent className="relative z-10 flex flex-wrap gap-2 px-5 pb-6 pt-0 sm:px-6">
          <Skeleton className="h-11 w-28 rounded-full bg-sky-100" />
          <Skeleton className="h-11 w-28 rounded-full bg-slate-200" />
        </DisplayPanelContent>
      </DisplayPanel>
    )
  }

  return (
    <DisplayPanel className="relative w-full overflow-hidden rounded-2xl border-primary/15 bg-slate-950 shadow-xl shadow-primary/5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(80,171,255,0.34),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_42%)]" />
      <DisplayPanelHeader className="relative overflow-hidden p-5 text-white sm:p-6">
        {leaderTool ? (
          <div className="dp-primary-hero-watermark pointer-events-none" aria-hidden>
            <MarketToolIcon tool={leaderTool} size="watermark" tone="watermark" />
          </div>
        ) : null}
        <div
          className={
            revealing
              ? 'animate-in fade-in relative z-10 flex flex-col gap-4 duration-300 sm:flex-row sm:items-start sm:justify-between'
              : 'relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'
          }
        >
          <div className="min-w-0 max-w-[68%] sm:max-w-[62%]">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
              <DisplayPanelTitle className="text-4xl leading-tight text-white sm:text-5xl">
                {content.title}
              </DisplayPanelTitle>
              {leader ? (
                <CandidateOriginBadge
                  candidate={leader}
                  variant="on-dark"
                  className="mb-1 shrink-0"
                />
              ) : null}
            </div>
            <DisplayPanelDescription className="mt-4 text-sm leading-7 text-white/76">
              {content.description}
            </DisplayPanelDescription>
            {leader?.candidateType === 'external_suggestion' && leader.externalBoundary ? (
              <p className="mt-3 rounded-xl border border-amber-200/30 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
                {leader.externalBoundary}
              </p>
            ) : null}
          </div>
          {showScore && leader ? (
            <div className="flex shrink-0 items-start sm:pt-0.5">
              <CandidateMatchScore candidate={leader} layout="hero" tone="dark" />
            </div>
          ) : null}
        </div>
      </DisplayPanelHeader>
      <DisplayPanelContent className="relative z-10 flex flex-wrap gap-2 px-5 pb-6 pt-0 sm:px-6">
        {payload?.confidenceLevel === 'low' ? (
          <p className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
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
