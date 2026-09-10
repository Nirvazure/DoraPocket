import assert from 'node:assert/strict'
import test from 'node:test'
import { selectAnalysisFlow, useStore } from '@/store'
import { shouldRestartAnalysisFlow } from '@/app/analyse/_domain/analysis-stage-restart'
import { createClarificationSession } from '@/shared/discovery/clarification-session'

test('flow reads the current clarification without persisting a second session copy', () => {
  const flow = { phase: 'revealed', beat: 'working' } as const
  const clarificationSession = {
    ...createClarificationSession('查天气'),
    status: 'clarifying' as const,
  }
  const resolved = selectAnalysisFlow({ analysisFlow: flow, clarificationSession })

  assert.equal(resolved.clarification, clarificationSession)
  assert.equal('clarification' in flow, false)
  assert.equal(
    shouldRestartAnalysisFlow({
      previousPrompt: '查天气',
      nextPrompt: '北京',
      anchorPrompt: '查天气',
      currentFlow: resolved,
    }),
    false,
  )
})

test('completed clarification is removed from the view without changing the animation beat', () => {
  const analysisFlow = {
    phase: 'analyzing',
    beat: 'cover',
    clarification: createClarificationSession('old task'),
  } as const
  assert.deepEqual(selectAnalysisFlow({ analysisFlow, clarificationSession: null }), {
    phase: 'analyzing',
    beat: 'cover',
  })
  const cleanFlow = { phase: 'idle', beat: 'working' } as const
  assert.equal(
    selectAnalysisFlow({ analysisFlow: cleanFlow, clarificationSession: null }),
    cleanFlow,
  )
})

test('starting or cancelling a task invalidates old replies and aborts their requests', (t) => {
  t.after(() => useStore.getState().cancelActiveAgentTurn())
  const first = useStore.getState().beginAgentTurn()
  const second = useStore.getState().beginAgentTurn()
  assert.equal(first.signal.aborted, true)
  assert.equal(second.signal.aborted, false)
  assert.equal(useStore.getState().isAgentTurnActive(first.turnId), false)
  assert.equal(useStore.getState().isAgentTurnActive(second.turnId), true)

  useStore.getState().cancelActiveAgentTurn()
  assert.equal(second.signal.aborted, true)
  assert.equal(useStore.getState().isAgentTurnActive(second.turnId), false)
  const third = useStore.getState().beginAgentTurn()
  assert.ok(third.turnId > second.turnId)
})
