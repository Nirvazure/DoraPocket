import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PrimaryRecommendationCard } from './primary-recommendation-card'
import { CandidateAlternativesCard } from './candidate-alternatives-card'
import { CandidateMatchScore } from './candidate-match-score'
import type { AgentUiPayload } from '@/shared/market/market-types'

const payload: AgentUiPayload = {
  recommendationMode: 'market',
  stageLabel: 'No match',
  stageTrail: [],
  taskFrame: {
    goal: 'Find cloud storage',
    mode: 'discover',
    missingInputs: [],
    constraints: [],
    confidenceDrivers: [],
  },
  candidates: [],
  selectionReason: '当前库中未找到达到 90% 匹配度的工具。',
  selectionSignals: [],
  preferenceSignals: [],
  recommendedActions: [],
}
const props = {
  payload,
  selectedToolPayload: { toolId: 'stale', args: {} },
  analysisFlow: { phase: 'revealed', beat: 'working' } as const,
  getTool: () => null,
  onSaveCandidate: () => {},
  onLaunchCandidate: () => {},
  onOpenExternalCandidate: () => {},
  recommendationSessionId: 'old-session',
}

test('empty recommendations show the threshold message without tool actions or evaluation controls', () => {
  const html = renderToStaticMarkup(createElement(PrimaryRecommendationCard, props))
  assert.match(html, /当前库中未找到达到 90% 匹配度的工具/)
  assert.doesNotMatch(html, /<button|立即打开|收进口袋|aria-label="匹配度/)
})

test('empty recommendations do not show alternative placeholders', () => {
  assert.equal(renderToStaticMarkup(createElement(CandidateAlternativesCard, props)), '')
})

test('legacy scores never render a task matching percentage', () => {
  assert.equal(
    renderToStaticMarkup(
      createElement(CandidateMatchScore, {
        candidate: {
          toolId: 'legacy',
          title: 'Legacy',
          candidateType: 'tool',
          score: 100,
          reason: 'Old ranking score',
          sourceLabel: 'market',
        },
      }),
    ),
    '',
  )
})
