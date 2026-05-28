import type { AgentCandidate } from '@/shared/market-types'

export function formatCandidateScore(candidate: AgentCandidate): string {
  const value = Math.max(0, Math.round(candidate.score))
  return `匹配度 ${value}`
}

export function shouldShowCandidateScore(
  explanationMode: 'brief' | 'standard' | undefined,
): boolean {
  return explanationMode !== 'brief'
}
