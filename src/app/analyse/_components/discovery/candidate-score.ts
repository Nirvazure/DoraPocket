import type { AgentCandidate } from '@/shared/market/market-types'

export function getCandidateScoreValue(candidate: AgentCandidate): number {
  return Math.max(0, Math.round(candidate.score))
}

export function formatCandidateScore(candidate: AgentCandidate): string {
  return `匹配度 ${getCandidateScoreValue(candidate)}`
}

export function shouldShowCandidateScore(
  explanationMode: 'brief' | 'standard' | undefined,
): boolean {
  return explanationMode !== 'brief'
}
