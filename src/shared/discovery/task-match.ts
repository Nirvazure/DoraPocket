import type { AgentCandidate, MatchAssessment } from '@/shared/market/market-types'

export function normalizeMatchAssessment(value: unknown): MatchAssessment | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (
    typeof item.matchScore !== 'number' ||
    !Number.isInteger(item.matchScore) ||
    item.matchScore < 0 ||
    item.matchScore > 100 ||
    typeof item.coreTaskSatisfied !== 'boolean' ||
    typeof item.requiredConstraintsSatisfied !== 'boolean' ||
    typeof item.reason !== 'string' ||
    !item.reason.trim()
  )
    return null
  return {
    matchScore: item.matchScore,
    coreTaskSatisfied: item.coreTaskSatisfied,
    requiredConstraintsSatisfied: item.requiredConstraintsSatisfied,
    reason: item.reason.trim(),
  }
}

export function hasSatisfiedTaskMatch(candidate: AgentCandidate): boolean {
  const assessment = normalizeMatchAssessment(candidate.matchAssessment)
  return assessment?.coreTaskSatisfied === true && assessment.requiredConstraintsSatisfied
}
