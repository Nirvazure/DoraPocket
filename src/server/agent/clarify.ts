import type { Step2DoneStatus } from '@/shared/step2-session-types'

type ClarifyInput = {
  missingInputs: string[]
  sessionTurn: 1 | 2 | 3
  skipClarify: boolean
}

export function resolveClarifyOutcome(input: ClarifyInput): Step2DoneStatus {
  if (input.missingInputs.length === 0) return 'ready'
  if (input.skipClarify) return input.sessionTurn >= 3 ? 'exhausted' : 'ready'
  if (input.sessionTurn >= 3) return 'exhausted'
  return 'clarifying'
}

export function buildClarifyQuestion(missingInputs: string[]): string {
  if (missingInputs.includes('城市')) return '需要哪个城市？'
  if (missingInputs.includes('网页链接')) return '请把网页链接发给我。'
  return `还可以补充：${missingInputs.join('、')}。`
}
