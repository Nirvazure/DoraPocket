import type { AnalysisStage } from '@/components/discovery/analysis-stage-content'

type ShouldRestartAnalysisFlowParams = {
  previousPrompt: string | null
  nextPrompt: string | null
  currentStage: AnalysisStage
}

const TERMINAL_STAGES: AnalysisStage[] = ['covered', 'revealing', 'ready']

export function shouldRestartAnalysisFlow({
  previousPrompt,
  nextPrompt,
  currentStage,
}: ShouldRestartAnalysisFlowParams) {
  const previous = previousPrompt?.trim() ?? ''
  const next = nextPrompt?.trim() ?? ''
  if (!previous || !next || previous === next) return false
  return TERMINAL_STAGES.includes(currentStage)
}
