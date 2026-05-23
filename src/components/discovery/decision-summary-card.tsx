import { type AnalysisStage } from '@/components/discovery/analysis-stage-content'
import { DecisionRationaleCard } from '@/components/discovery/decision-rationale-card'
import type { ChatToolPayload } from '@/services/llm'
import type { AgentUiPayload } from '@/shared/market-types'
import type { AppState } from '@/store'

type DecisionSummaryCardProps = {
  payload: AgentUiPayload | null
  selectedToolPayload: ChatToolPayload
  appState: AppState
  analysisStage: AnalysisStage
}

export function DecisionSummaryCard({
  payload,
  selectedToolPayload,
  appState,
  analysisStage,
}: DecisionSummaryCardProps) {
  return (
    <DecisionRationaleCard
      payload={payload}
      selectedToolPayload={selectedToolPayload}
      appState={appState}
      analysisStage={analysisStage}
    />
  )
}
