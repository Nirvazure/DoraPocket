import { type AnalysisFlow } from '@/shared/analysis-stage-content'
import { CandidateAlternativesCard } from '@/app/analyse/_components/discovery/candidate-alternatives-card'
import { PrimaryRecommendationCard } from '@/app/analyse/_components/discovery/primary-recommendation-card'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market-types'
import type { ToolLookupFn } from '@/shared/tool-lookup'
import type { UserSettings } from '@/shared/user-settings'

type CompactDecisionPanelProps = {
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

export function CompactDecisionPanel({
  payload,
  selectedToolPayload,
  analysisFlow,
  getTool,
  explanationMode = 'standard',
  onSaveCandidate,
  onLaunchCandidate,
  onOpenExternalCandidate,
  recommendationSessionId = null,
}: CompactDecisionPanelProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      <PrimaryRecommendationCard
        payload={payload}
        selectedToolPayload={selectedToolPayload}
        analysisFlow={analysisFlow}
        getTool={getTool}
        explanationMode={explanationMode}
        onSaveCandidate={onSaveCandidate}
        onLaunchCandidate={onLaunchCandidate}
        onOpenExternalCandidate={onOpenExternalCandidate}
        recommendationSessionId={recommendationSessionId}
      />
      <CandidateAlternativesCard
        payload={payload}
        selectedToolPayload={selectedToolPayload}
        analysisFlow={analysisFlow}
        getTool={getTool}
        explanationMode={explanationMode}
        onOpenExternalCandidate={onOpenExternalCandidate}
      />
    </div>
  )
}
