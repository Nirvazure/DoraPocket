import type { AgentTaskFrame } from '@/shared/market-types'
import type { PocketIntent, PocketSelectedTool } from '@/server/agent/state'

const WEB_KEYWORDS = ['网页', '链接', '摘要'] as const
const AIR_AND_WEATHER_KEYWORDS = ['天气', '空气'] as const
const POCKET_KEYWORDS = ['收藏', '口袋'] as const
const DISCOVERY_KEYWORDS = ['工具', '推荐', '找个', '网站', '资源', '怎么找'] as const
const BUILTIN_KEYWORDS = ['天气', '时间', '汇率', '空气', '摘要', '链接'] as const
const COMMON_CITY_PATTERN = /北京|上海|广州|深圳|杭州|西安|成都|重庆|南京|苏州|天津|武汉|长沙/

export type Classified = {
  intent: PocketIntent
  selectedTool: PocketSelectedTool
}

export function intentFromToolId(toolId: string): PocketIntent {
  if (toolId === 'weather') return 'weather'
  if (toolId === 'time') return 'time'
  if (toolId === 'exchange_rate') return 'exchange'
  if (toolId === 'air_quality') return 'air_quality'
  if (toolId === 'web_summary') return 'web_summary'
  return 'discover'
}

export function buildTaskFrame(
  userText: string,
  answerBookFromPocket: boolean,
  builtinToolsEnabled: boolean,
): AgentTaskFrame {
  if (answerBookFromPocket) {
    return {
      goal: userText,
      mode: 'answer_book',
      missingInputs: [],
    }
  }

  const text = userText.trim()
  const lower = text.toLowerCase()
  const missingInputs: string[] = []

  if (
    WEB_KEYWORDS.some((keyword) => lower.includes(keyword)) &&
    !/^https?:\/\//i.test(text) &&
    !lower.includes('www.')
  ) {
    missingInputs.push('网页链接')
  }

  if (
    AIR_AND_WEATHER_KEYWORDS.some((keyword) => lower.includes(keyword)) &&
    !COMMON_CITY_PATTERN.test(text)
  ) {
    missingInputs.push('城市')
  }

  if (POCKET_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return { goal: text, mode: 'manage_pocket', missingInputs }
  }

  if (DISCOVERY_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return { goal: text, mode: 'discover', missingInputs }
  }

  if (builtinToolsEnabled && BUILTIN_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return { goal: text, mode: 'use_builtin', missingInputs }
  }

  if (!builtinToolsEnabled && BUILTIN_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return { goal: text, mode: missingInputs.length > 0 ? 'discover' : 'chat', missingInputs }
  }

  return { goal: text, mode: 'chat', missingInputs }
}
