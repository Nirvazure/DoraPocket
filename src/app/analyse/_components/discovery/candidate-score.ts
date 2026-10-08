import type { AgentCandidate } from '@/shared/market/market-types'
import { hasSatisfiedTaskMatch } from '@/shared/discovery/task-match'

export function getCandidateScoreValue(candidate: AgentCandidate): number {
  return candidate.matchAssessment?.matchScore ?? 0
}

export function formatCandidateScore(candidate: AgentCandidate): string {
  if (!shouldShowCandidateScore('standard', candidate)) return ''
  return `匹配度 ${getCandidateScoreValue(candidate)}%`
}

export function shouldShowCandidateScore(
  explanationMode: 'brief' | 'standard' | undefined,
  candidate?: AgentCandidate | null,
): boolean {
  return explanationMode !== 'brief' && candidate != null && hasSatisfiedTaskMatch(candidate)
}
