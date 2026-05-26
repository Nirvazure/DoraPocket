import type { AnalysisFlow } from '@/components/discovery/analysis-stage-content'
import { shouldPreserveTurnFlow } from '@/components/discovery/analysis-stage-content'

type ShouldRestartAnalysisFlowParams = {
  previousPrompt: string | null
  nextPrompt: string | null
  currentFlow: AnalysisFlow
}

export function shouldRestartAnalysisFlow({
  previousPrompt,
  nextPrompt,
  currentFlow,
}: ShouldRestartAnalysisFlowParams) {
  const previous = previousPrompt?.trim() ?? ''
  const next = nextPrompt?.trim() ?? ''
  if (!previous || !next || previous === next) return false
  return shouldPreserveTurnFlow(currentFlow)
}
