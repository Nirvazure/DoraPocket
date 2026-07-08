import test from 'node:test'
import assert from 'node:assert/strict'

import {
  IDLE_ANALYSIS_FLOW,
  isAnalyzingFlow,
  isInputLockedFlow,
  resolveActiveTrackIndexFromProgress,
  resolveCurrentStep,
  resolveLiveTrackActiveIndex,
  resolveAnalysisFlowAfterError,
  shouldPreserveTurnFlow,
} from '@/app/analyse/_domain/analysis-stage-content'

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

test('resolveActiveTrackIndexFromProgress marks constraining active during clarifying', () => {
  assert.equal(resolveActiveTrackIndexFromProgress('clarifying'), 1)
})

test('resolveLiveTrackActiveIndex starts on understanding before progress arrives', () => {
  assert.equal(
    resolveLiveTrackActiveIndex({
      progressStage: null,
      analysisFlow: { phase: 'analyzing', beat: 'working' },
      appState: 'thinking',
      hasPayload: false,
    }),
    0,
  )
})

test('resolveCurrentStep stays on analysis panel during cover beat', () => {
  assert.equal(resolveCurrentStep({ phase: 'analyzing', beat: 'cover' }, true, true), 2)
})

test('resolveCurrentStep opens recommendation panel at reveal beat', () => {
  assert.equal(resolveCurrentStep({ phase: 'analyzing', beat: 'reveal' }, true, true), 3)
})

test('resolveCurrentStep opens recommendation panel after revealed', () => {
  assert.equal(resolveCurrentStep({ phase: 'revealed', beat: 'working' }, true, true), 3)
})

test('isInputLockedFlow returns false when step2 status is clarifying', () => {
  assert.equal(
    isInputLockedFlow({
      phase: 'analyzing',
      beat: 'working',
      clarification: {
        turn: 1,
        anchorPrompt: '???',
        messages: [],
        status: 'clarifying',
        dialogueExpanded: false,
        quickReplies: ['??'],
      },
    }),
    false,
  )
})
