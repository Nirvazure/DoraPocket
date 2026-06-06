import type { AnalysisFlow } from '@/shared/analysis-stage-content'
import { shouldPreserveTurnFlow } from '@/shared/analysis-stage-content'

export type ShouldRestartAnalysisFlowParams = {
  previousPrompt: string | null
  nextPrompt: string | null
  currentFlow: AnalysisFlow
  anchorPrompt?: string | null
}

export function isStep2Continuation(
  currentFlow: AnalysisFlow,
  nextPrompt: string,
  anchorPrompt: string,
): boolean {
  if (currentFlow.step2?.status !== 'clarifying') return false
  const next = nextPrompt.trim()
  const anchor = anchorPrompt.trim()
  return Boolean(next && anchor && next !== anchor)
}

export function shouldRestartAnalysisFlow({
  previousPrompt,
  nextPrompt,
  currentFlow,
  anchorPrompt,
}: ShouldRestartAnalysisFlowParams): boolean {
  const previous = previousPrompt?.trim() ?? ''
  const next = nextPrompt?.trim() ?? ''
  if (!previous || !next || previous === next) return false
  if (anchorPrompt && isStep2Continuation(currentFlow, next, anchorPrompt)) return false
  return shouldPreserveTurnFlow(currentFlow)
}
