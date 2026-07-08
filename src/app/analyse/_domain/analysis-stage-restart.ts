import type { AnalysisFlow } from '@/app/analyse/_domain/analysis-stage-content'
import { shouldPreserveTurnFlow } from '@/app/analyse/_domain/analysis-stage-content'

export type ShouldRestartAnalysisFlowParams = {
  previousPrompt: string | null
  nextPrompt: string | null
  currentFlow: AnalysisFlow
  anchorPrompt?: string | null
}

export function isClarificationContinuation(
  currentFlow: AnalysisFlow,
  nextPrompt: string,
  anchorPrompt: string,
): boolean {
  if (currentFlow.clarification?.status !== 'clarifying') return false
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
  if (anchorPrompt && isClarificationContinuation(currentFlow, next, anchorPrompt)) return false
  return shouldPreserveTurnFlow(currentFlow)
}
