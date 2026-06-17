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
  if (missingInputs.includes('使用场景')) {
    return brief ? '具体做什么？' : '这次具体想完成什么任务或产出？'
  }
  if (missingInputs.includes('预算偏好')) {
    return brief ? '免费还是可付费？' : '这次更看重免费优先，还是可以接受订阅/付费？'
  }
  if (missingInputs.includes('注册偏好')) {
    return brief ? '能接受注册吗？' : '这次希望免注册直接用，还是可以接受注册账号？'
  }
  if (missingInputs.includes('证据要求')) {
    return brief ? '要引用吗？' : '结果需要附来源/引用，还是只要直接可用？'
  }
  if (missingInputs.includes('平台偏好')) {
    return brief ? '网页、移动端还是 API？' : '这次主要想用网页端、移动端，还是需要 API 接入？'
  }
  if (missingInputs.includes('语言偏好')) {
    return brief ? '中文优先吗？' : '这次是否需要中文体验优先？'
  }
  if (missingInputs.includes('团队规模')) {
    return brief ? '个人还是团队？' : '这次是个人使用、小团队协作，还是企业场景？'
  }
  if (missingInputs.includes('城市')) return brief ? '哪个城市？' : '需要哪个城市？'
  if (missingInputs.includes('网页链接')) {
    return brief ? '发一下网页链接。' : '请把网页链接发给我。'
  }
  return brief
    ? `补充一下：${missingInputs.join('、')}`
    : `还可以补充：${missingInputs.join('、')}。`
}
