import test from 'node:test'
import assert from 'node:assert/strict'

import { shouldRestartAnalysisFlow } from './analysis-stage-restart'

test('restarts analysis flow for a new prompt after previous turn finished', () => {
  assert.equal(
    shouldRestartAnalysisFlow({
      previousPrompt: '帮我找一个番茄钟工具',
      nextPrompt: '我想做一页简历',
      currentFlow: { phase: 'revealed', beat: 'working' },
    }),
    true,
  )
})

test('does not restart analysis flow when prompt is unchanged', () => {
  assert.equal(
    shouldRestartAnalysisFlow({
      previousPrompt: '帮我找一个番茄钟工具',
      nextPrompt: '帮我找一个番茄钟工具',
      currentFlow: { phase: 'revealed', beat: 'working' },
    }),
    false,
  )
})
