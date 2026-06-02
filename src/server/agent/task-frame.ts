import type { AgentTaskFrame } from '@/shared/market-types'

const POCKET_KEYWORDS = ['收藏', '口袋'] as const
const DISCOVERY_KEYWORDS = ['工具', '推荐', '找个', '网站', '资源', '怎么找'] as const

export function buildTaskFrame(userText: string): AgentTaskFrame {
  const text = userText.trim()
  const lower = text.toLowerCase()
  const missingInputs: string[] = []

  if (POCKET_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return { goal: text, mode: 'manage_pocket', missingInputs }
  }

  if (DISCOVERY_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return { goal: text, mode: 'discover', missingInputs }
  }

  return { goal: text, mode: 'discover', missingInputs }
}
