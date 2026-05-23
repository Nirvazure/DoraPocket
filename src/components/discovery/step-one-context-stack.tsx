import { type AnalysisStage } from '@/components/discovery/analysis-stage-content'
import { IntentUnderstandingCard } from '@/components/discovery/intent-understanding-card'
import type { AgentUiPayload } from '@/shared/market-types'
import type { AppState } from '@/store'

type StepOneContextStackProps = {
  currentPrompt: string | null
  payload: AgentUiPayload | null
  appState: AppState
  analysisStage: AnalysisStage
}

export function StepOneContextStack({
  currentPrompt,
  payload,
  appState,
  analysisStage,
}: StepOneContextStackProps) {
  return (
    <div className="space-y-3">
      <IntentUnderstandingCard
        currentPrompt={currentPrompt}
        payload={payload}
        appState={appState}
        analysisStage={analysisStage}
      />
    </div>
  )
}
