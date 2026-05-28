const CITY_PRESETS = ['北京', '上海', '广州', '深圳'] as const

export function resolveQuickReplies(missingInputs: string[], agentReplies?: string[]): string[] {
  if (agentReplies?.length) return agentReplies.slice(0, 4)
  if (missingInputs.includes('城市')) return [...CITY_PRESETS]
  return []
}
