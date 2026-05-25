import {
  resolveLeadingCandidate,
  type AnalysisFlow,
} from '@/components/discovery/analysis-stage-content'
import { ActionClosureCard } from '@/components/discovery/action-closure-card'
import { CandidateAlternativesCard } from '@/components/discovery/candidate-alternatives-card'
import { PrimaryRecommendationCard } from '@/components/discovery/primary-recommendation-card'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market-types'

type CompactDecisionPanelProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  analysisFlow: AnalysisFlow
  autoSaveNotice: { toolId: string; label: string } | null
  autoSaveEnabled: boolean
  onSaveCandidate: (toolId: string) => void
  onLaunchCandidate: (toolId: string) => void
  onOpenExternalCandidate: (url: string) => void
  onOpenPocket: () => void
  onUndoAutoSave: () => void
  onEnableAutoSave: () => void
  onFeedback: (toolId: string, vote: 'up' | 'down') => void
}

export function CompactDecisionPanel({
  payload,
  selectedToolPayload,
  analysisFlow,
  autoSaveNotice,
  autoSaveEnabled,
  onSaveCandidate,
  onLaunchCandidate,
  onOpenExternalCandidate,
  onOpenPocket,
  onUndoAutoSave,
  onEnableAutoSave,
  onFeedback,
}: CompactDecisionPanelProps) {
  const leader = resolveLeadingCandidate(payload, selectedToolPayload)
  const leaderToolId = leader?.toolId ?? selectedToolPayload?.toolId ?? null

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
      <ActionClosureCard
        leaderToolId={leaderToolId}
        analysisFlow={analysisFlow}
        autoSaveNotice={autoSaveNotice}
        autoSaveEnabled={autoSaveEnabled}
        onOpenPocket={onOpenPocket}
        onUndoAutoSave={onUndoAutoSave}
        onEnableAutoSave={onEnableAutoSave}
        onFeedback={onFeedback}
      />
    </div>
  )
}
