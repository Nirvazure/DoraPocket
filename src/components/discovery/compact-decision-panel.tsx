import { type AnalysisFlow } from '@/components/discovery/analysis-stage-content'
import { CandidateAlternativesCard } from '@/components/discovery/candidate-alternatives-card'
import { PrimaryRecommendationCard } from '@/components/discovery/primary-recommendation-card'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market-types'

type CompactDecisionPanelProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  analysisFlow: AnalysisFlow
  onSaveCandidate: (toolId: string) => void
  onLaunchCandidate: (toolId: string) => void
  onOpenExternalCandidate: (url: string) => void
}

export function CompactDecisionPanel({
  payload,
  selectedToolPayload,
  analysisFlow,
  onSaveCandidate,
  onLaunchCandidate,
  onOpenExternalCandidate,
}: CompactDecisionPanelProps) {
  return (
    <div className="space-y-3">
      <PrimaryRecommendationCard
        payload={payload}
        selectedToolPayload={selectedToolPayload}
        analysisFlow={analysisFlow}
        onSaveCandidate={onSaveCandidate}
        onLaunchCandidate={onLaunchCandidate}
        onOpenExternalCandidate={onOpenExternalCandidate}
      />
      <CandidateAlternativesCard
        payload={payload}
        selectedToolPayload={selectedToolPayload}
        analysisFlow={analysisFlow}
      />
    </div>
  )
}
