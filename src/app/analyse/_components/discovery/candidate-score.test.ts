import assert from 'node:assert/strict'
import test from 'node:test'
import { getCandidateScoreValue, shouldShowCandidateScore } from './candidate-score'
import type { AgentCandidate } from '@/shared/market/market-types'

const legacy: AgentCandidate = {
  title: 'Old recommendation',
  candidateType: 'tool',
  score: 100,
  reason: 'Old relative score',
  sourceLabel: 'market',
}

test('legacy relative scores are not displayed as task match percentages', () => {
  assert.equal(shouldShowCandidateScore('standard', legacy), false)
})

test('new task match percentages preserve absolute assessments', () => {
  const candidate = {
    ...legacy,
    matchAssessment: {
      matchScore: 92,
      coreTaskSatisfied: true,
      requiredConstraintsSatisfied: true,
      reason: 'Provides the requested capability',
    },
  }
  assert.equal(getCandidateScoreValue(candidate), 92)
  assert.equal(shouldShowCandidateScore('standard', candidate), true)
  assert.equal(shouldShowCandidateScore('brief', candidate), false)
})
