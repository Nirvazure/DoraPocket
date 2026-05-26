import test from 'node:test'
import assert from 'node:assert/strict'

import {
  IDLE_ANALYSIS_FLOW,
  isAnalyzingFlow,
  isInputLockedFlow,
  resolveAnalysisFlowAfterError,
  shouldPreserveTurnFlow,
} from '@/components/discovery/analysis-stage-content'

test('resolveAnalysisFlowAfterError unlocks input and stops analyzing UI', () => {
  const flow = resolveAnalysisFlowAfterError()
  assert.deepEqual(flow, IDLE_ANALYSIS_FLOW)
  assert.equal(isAnalyzingFlow(flow), false)
  assert.equal(isInputLockedFlow(flow), false)
})

test('shouldPreserveTurnFlow keeps cover and reveal beats but not working', () => {
  assert.equal(shouldPreserveTurnFlow({ phase: 'analyzing', beat: 'working' }), false)
  assert.equal(shouldPreserveTurnFlow({ phase: 'analyzing', beat: 'cover' }), true)
  assert.equal(shouldPreserveTurnFlow({ phase: 'analyzing', beat: 'reveal' }), true)
  assert.equal(shouldPreserveTurnFlow({ phase: 'revealed', beat: 'working' }), true)
})
