const CITY_PRESETS = ['北京', '上海', '广州', '深圳'] as const
const PRESET_REPLIES: Record<string, string[]> = {
  预算偏好: ['免费优先', '可接受订阅', '企业预算'],
  注册偏好: ['免注册优先', '可以注册'],
  证据要求: ['要引用来源', '不需要引用'],
  平台偏好: ['网页端', '移动端', '需要 API'],
  语言偏好: ['中文优先', '英文也可以'],
  团队规模: ['个人使用', '小团队', '企业协作'],
  速度偏好: ['最快上手', '结果质量优先'],
}

export function resolveQuickReplies(missingInputs: string[], agentReplies?: string[]): string[] {
  if (agentReplies?.length) return agentReplies.slice(0, 4)
  if (missingInputs.includes('城市')) return [...CITY_PRESETS]
  for (const input of missingInputs) {
    const replies = PRESET_REPLIES[input]
    if (replies) return replies.slice(0, 4)
  }
  return []
}
