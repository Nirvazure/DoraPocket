import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeMatchAssessment } from '@/shared/discovery/task-match'

const assessment = {
  matchScore: 90,
  coreTaskSatisfied: true,
  requiredConstraintsSatisfied: true,
  reason: 'Provides cloud file storage',
}

test('accepts a complete task match assessment without inflating the score', () => {
  assert.deepEqual(normalizeMatchAssessment(assessment), assessment)
})

for (const score of [-1, 101, 89.5, NaN, Infinity, '90', null, undefined]) {
  test(`rejects invalid match score ${String(score)}`, () => {
    assert.equal(normalizeMatchAssessment({ ...assessment, matchScore: score }), null)
  })
}

test('rejects missing verdicts and reasons instead of inventing positive evidence', () => {
  for (const field of [
    'matchScore',
    'coreTaskSatisfied',
    'requiredConstraintsSatisfied',
    'reason',
  ]) {
    const incomplete: Record<string, unknown> = { ...assessment }
    delete incomplete[field]
    assert.equal(normalizeMatchAssessment(incomplete), null)
  }
  assert.equal(normalizeMatchAssessment({ ...assessment, reason: '  ' }), null)
  assert.equal(normalizeMatchAssessment({ ...assessment, coreTaskSatisfied: 'true' }), null)
})
