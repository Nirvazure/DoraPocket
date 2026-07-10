import { ExternalLink, FolderOpenDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketToolIcon } from '@/components/shared/market-tool-icon'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { CandidateMatchScore } from '@/app/analyse/_components/discovery/candidate-match-score'
import { CandidateOriginBadge } from '@/app/analyse/_components/discovery/candidate-origin-badge'
import { shouldShowCandidateScore } from '@/app/analyse/_components/discovery/candidate-score'
import { RecommendationEvaluationBar } from '@/app/analyse/_components/discovery/recommendation-evaluation-bar'
import {
  buildPrimaryRecommendation,
  isRecommendationRevealing,
  type AnalysisFlow,
} from '@/app/analyse/_domain/analysis-stage-content'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market/market-types'
import { CLARIFICATION_COPY } from '@/shared/copy/ui-copy'
import type { ToolLookupFn } from '@/shared/market/tool-lookup'
import type { UserSettings } from '@/shared/user/user-settings'

type PrimaryRecommendationCardProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  analysisFlow: AnalysisFlow
  getTool: ToolLookupFn
  explanationMode?: UserSettings['explanationMode']
  onSaveCandidate: (toolId: string) => void
  onLaunchCandidate: (toolId: string) => void
  onOpenExternalCandidate: (url: string) => void
  recommendationSessionId?: string | null
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
  recommendationSessionId = null,
}: PrimaryRecommendationCardProps) {
  const content = buildPrimaryRecommendation(payload, selectedToolPayload, getTool)
  const leader = content.leader
  const showScore = shouldShowCandidateScore(explanationMode) && leader != null
  const leaderToolId = leader?.toolId ?? null
  const leaderTool = getTool(leaderToolId)
  const leaderExternalUrl =
    leader?.candidateType === 'external_suggestion' ? (leader.url ?? null) : null
  const revealing = isRecommendationRevealing(analysisFlow)

  return (
    <DisplayPanel className="relative w-full overflow-hidden rounded-xl border-primary/15 bg-slate-950 shadow-xl shadow-primary/5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(80,171,255,0.34),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_42%)]" />
      <DisplayPanelHeader className="relative overflow-hidden p-4 text-white sm:p-5">
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
              <DisplayPanelTitle className="text-2xl leading-tight text-white sm:text-3xl lg:text-4xl">
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
            <DisplayPanelDescription className="mt-3 line-clamp-2 text-sm leading-6 text-white/76">
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
      <DisplayPanelContent className="relative z-10 flex flex-wrap gap-2 px-4 pb-4 pt-0 sm:px-5">
        {payload?.confidenceLevel === 'low' ? (
          <p className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {CLARIFICATION_COPY.lowConfidenceHint}
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
        <RecommendationEvaluationBar
          recommendationSessionId={recommendationSessionId}
          selectedToolId={leaderToolId}
        />
      </DisplayPanelContent>
    </DisplayPanel>
  )
}
