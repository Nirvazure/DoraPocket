import type { ExplanationMode } from '@/shared/user-settings'
import type { Step2DoneStatus } from '@/shared/step2-session-types'

type ClarifyInput = {
  missingInputs: string[]
  sessionTurn: 1 | 2 | 3
  skipClarify: boolean
  explanationMode?: ExplanationMode
}

function resolveMaxClarifyTurn(explanationMode: ExplanationMode | undefined) {
  // sessionTurn starts at 1; exhaust when turn reaches this threshold.
  return explanationMode === 'brief' ? 2 : 3
}

export function resolveClarifyOutcome(input: ClarifyInput): Step2DoneStatus {
  if (input.missingInputs.length === 0) return 'ready'
  const maxTurn = resolveMaxClarifyTurn(input.explanationMode)
  if (input.skipClarify) return input.sessionTurn >= maxTurn ? 'exhausted' : 'ready'
  if (input.sessionTurn >= maxTurn) return 'exhausted'
  return 'clarifying'
}

export function buildClarifyQuestion(
  missingInputs: string[],
  explanationMode: ExplanationMode = 'standard',
): string {
  const brief = explanationMode === 'brief'
  if (missingInputs.includes('城市')) return brief ? '哪个城市？' : '需要哪个城市？'
  if (missingInputs.includes('网页链接')) {
    return brief ? '发一下网页链接。' : '请把网页链接发给我。'
  }
  return brief
    ? `补充一下：${missingInputs.join('、')}`
    : `还可以补充：${missingInputs.join('、')}。`
}
