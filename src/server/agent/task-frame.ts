import type { AgentTaskFrame } from '@/shared/market-types'
import { extractColdStartTaskLine } from '@/shared/starter-intake'

const POCKET_KEYWORDS = ['收藏', '口袋'] as const
const DISCOVERY_KEYWORDS = ['工具', '推荐', '找个', '网站', '资源', '怎么找'] as const

function resolveGoalText(userText: string): string {
  const text = userText.trim()
  if (text.includes('【冷启动】')) {
    return extractColdStartTaskLine(text)
  }
  return text
}

export function buildTaskFrame(userText: string): AgentTaskFrame {
  const goal = resolveGoalText(userText)
  const lower = goal.toLowerCase()
  const missingInputs: string[] = []

  if (POCKET_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return { goal, mode: 'manage_pocket', missingInputs }
  }

  if (DISCOVERY_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return { goal, mode: 'discover', missingInputs }
  }

  return { goal, mode: 'discover', missingInputs }
}
