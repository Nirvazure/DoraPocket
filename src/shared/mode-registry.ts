import {
  BUILTIN_AIR_CANNON_TOOL_ID,
  BUILTIN_ANYWHERE_DOOR_TOOL_ID,
  BUILTIN_ANSWER_BOOK_TOOL_ID,
  BUILTIN_ENLARGE_LAMP_TOOL_ID,
  BUILTIN_SHRINK_LAMP_TOOL_ID,
  TOOL_ID_AIR_QUALITY,
  TOOL_ID_EXCHANGE,
  TOOL_ID_TIME,
  TOOL_ID_WEATHER,
  TOOL_ID_WEB_SUMMARY,
} from '@/services/tool-registry'

export type AssistantModeCard = {
  title: string
  description: string
  imageSrc?: string
  selectKey?: string
  toolId?: string
}

export const ANSWER_BOOK_SELECT_KEY = 'answer_book' as const
export const MODE_KEY_ANYWHERE_DOOR = 'mode_anywhere_door' as const
export const MODE_KEY_SHRINK_LAMP = 'mode_shrink_lamp' as const
export const MODE_KEY_ENLARGE_LAMP = 'mode_enlarge_lamp' as const
export const MODE_KEY_AIR_CANNON = 'mode_air_cannon' as const

export const DEFAULT_MODE_IMAGE = '/images/assistant-avatar.svg'

const DORA_PROP_IMG = {
  a1: '/images/dora%20(1).webp',
  a2: '/images/dora%20(2).webp',
  a3: '/images/dora%20(3).webp',
  a4: '/images/dora%20(4).webp',
  a5: '/images/dora%20(5).webp',
  a6: '/images/dora%20(6).webp',
  a7: '/images/dora%20(7).webp',
} as const

export const ANSWER_BOOK_MODE: AssistantModeCard = {
  title: '答案之书',
  description: '内置模式：只给一句简短回答。',
  imageSrc: DORA_PROP_IMG.a3,
  selectKey: ANSWER_BOOK_SELECT_KEY,
  toolId: BUILTIN_ANSWER_BOOK_TOOL_ID,
}

export const ASSISTANT_MODES: AssistantModeCard[] = [
  {
    title: '任意门',
    description: '内置模式：优先扩展候选面，帮你找最合适的工具。',
    imageSrc: DORA_PROP_IMG.a1,
    selectKey: MODE_KEY_ANYWHERE_DOOR,
    toolId: BUILTIN_ANYWHERE_DOOR_TOOL_ID,
  },
  {
    title: '缩小灯',
    description: '内置模式：先拆小任务，再对应找工具。',
    imageSrc: DORA_PROP_IMG.a2,
    selectKey: MODE_KEY_SHRINK_LAMP,
    toolId: BUILTIN_SHRINK_LAMP_TOOL_ID,
  },
  {
    title: '放大灯',
    description: '内置模式：强化对比、解释和优劣判断。',
    imageSrc: DORA_PROP_IMG.a3,
    selectKey: MODE_KEY_ENLARGE_LAMP,
    toolId: BUILTIN_ENLARGE_LAMP_TOOL_ID,
  },
  {
    title: '空气炮',
    description: '内置模式：快速收敛成一个最值得先试的工具。',
    imageSrc: DORA_PROP_IMG.a4,
    selectKey: MODE_KEY_AIR_CANNON,
    toolId: BUILTIN_AIR_CANNON_TOOL_ID,
  },
  ANSWER_BOOK_MODE,
]

const TOOL_MODE_CARD_MAP: Record<string, AssistantModeCard> = {
  [TOOL_ID_WEATHER]: {
    title: '天气工具',
    description: '已命中天气原生能力。',
    imageSrc: DORA_PROP_IMG.a6,
    toolId: TOOL_ID_WEATHER,
  },
  [TOOL_ID_TIME]: {
    title: '时间工具',
    description: '已命中时间原生能力。',
    imageSrc: DORA_PROP_IMG.a7,
    toolId: TOOL_ID_TIME,
  },
  [TOOL_ID_EXCHANGE]: {
    title: '汇率工具',
    description: '已命中汇率换算能力。',
    imageSrc: DORA_PROP_IMG.a5,
    toolId: TOOL_ID_EXCHANGE,
  },
  [TOOL_ID_AIR_QUALITY]: {
    title: '空气质量工具',
    description: '已命中空气质量原生能力。',
    imageSrc: DORA_PROP_IMG.a4,
    toolId: TOOL_ID_AIR_QUALITY,
  },
  [TOOL_ID_WEB_SUMMARY]: {
    title: '网页摘要工具',
    description: '已命中网页摘要原生能力。',
    imageSrc: DORA_PROP_IMG.a2,
    toolId: TOOL_ID_WEB_SUMMARY,
  },
}

const FALLBACK_MODE_CARD: AssistantModeCard = {
  title: '口袋推荐',
  description: '先确定一个最高价值工具，再继续沉淀到口袋。',
  imageSrc: DORA_PROP_IMG.a1,
  toolId: BUILTIN_ANYWHERE_DOOR_TOOL_ID,
}

export function modeImageSrc(card: AssistantModeCard): string {
  const value = card.imageSrc?.trim()
  return value && value.length > 0 ? value : DEFAULT_MODE_IMAGE
}

export function getModeBySelectKey(key: string | null): AssistantModeCard | null {
  if (!key) return null
  for (const mode of ASSISTANT_MODES) {
    if (mode.selectKey === key) return mode
  }
  return null
}

export function getModeByToolId(toolId: string | null | undefined): AssistantModeCard | null {
  if (!toolId) return null
  return TOOL_MODE_CARD_MAP[toolId] ?? null
}

export function pickModeCardAfterTurn(
  activeKey: string | null,
  selectedToolId?: string,
): AssistantModeCard {
  const selected = getModeBySelectKey(activeKey)
  if (selected) return { ...selected }
  const byTool = getModeByToolId(selectedToolId)
  if (byTool) return { ...byTool }
  return FALLBACK_MODE_CARD
}
