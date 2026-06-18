import type { AgentCandidate, AgentTaskFrame } from '@/shared/market-types'

export type ProfileTaskDirectionId =
  | 'all'
  | 'research'
  | 'content_structure'
  | 'office_tools'
  | 'design_assets'
  | 'data_analytics'
  | 'workflow_automation'
  | 'video_audio'
  | 'knowledge_learning'
  | 'general'

export type ProfileHistoryStatusFilter = 'all' | 'saved' | 'evaluated' | 'low_confidence'

export type ProfileTaskDirection = {
  id: ProfileTaskDirectionId
  label: string
  description: string
  keywords: string[]
}

export type RecommendationHistoryItem = {
  id: string
  createdAt: number
  userText: string
  finalText: string
  selectedToolId?: string | null
  taskFrame: AgentTaskFrame
  candidates: AgentCandidate[]
  selectionReason: string
  preferenceSignals: string[]
  selectionSignals: string[]
  starterPath?: string | null
  clarifyTurnCount: number
  confidenceLevel?: 'normal' | 'low' | null
  openedToolId?: string | null
  savedToolId?: string | null
  evaluatedAt?: number | null
}

export type ProfileDirectionStat = {
  id: ProfileTaskDirectionId
  label: string
  count: number
  signals: string[]
}

export type ProfileMemorySummary = {
  totalCount: number
  savedCount: number
  evaluatedCount: number
  lowConfidenceCount: number
  directionStats: ProfileDirectionStat[]
  preferenceSignals: string[]
}

export const PROFILE_TASK_DIRECTIONS: ProfileTaskDirection[] = [
  {
    id: 'research',
    label: '资料搜索',
    description: '调研、来源、引用和可核验资料。',
    keywords: ['搜索', '调研', '引用', '来源', '资料', 'research', '查资料', '可核验'],
  },
  {
    id: 'content_structure',
    label: '内容整理',
    description: '总结、长文结构化和会议纪要。',
    keywords: ['总结', '整理', '会议纪要', '长文', '结构化', '内容'],
  },
  {
    id: 'office_tools',
    label: '办公处理',
    description: 'PDF、翻译、表格、文档和低摩擦办公任务。',
    keywords: ['pdf', '翻译', '表格', '压缩', '文档', '办公'],
  },
  {
    id: 'design_assets',
    label: '设计素材',
    description: '图片、海报、视觉和设计产出。',
    keywords: ['图片', '海报', '设计', '视觉', '素材', '产品图', '做图'],
  },
  {
    id: 'data_analytics',
    label: '数据分析',
    description: '数据、报表、可视化和业务洞察。',
    keywords: ['数据', '报表', '可视化', '分析', 'analytics'],
  },
  {
    id: 'workflow_automation',
    label: '流程自动化',
    description: '重复流程、自动化和工作流串联。',
    keywords: ['自动化', '工作流', '重复流程', '流程', 'automation'],
  },
  {
    id: 'video_audio',
    label: '视频音频',
    description: '视频、音频、转写、剪辑和配音。',
    keywords: ['视频', '音频', '转写', '剪辑', '配音'],
  },
  {
    id: 'knowledge_learning',
    label: '学习知识',
    description: '笔记、学习、知识库和复习。',
    keywords: ['笔记', '学习', '知识库', '复习', '知识'],
  },
  {
    id: 'general',
    label: '通用判断',
    description: '尚未归入明确方向的任务。',
    keywords: [],
  },
]

const GENERAL_DIRECTION = PROFILE_TASK_DIRECTIONS.find((item) => item.id === 'general')!

function textIncludesAny(text: string, keywords: string[]) {
  const lower = text.toLowerCase()
  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()))
}

function collectDirectionText(item: RecommendationHistoryItem) {
  return [
    item.userText,
    item.finalText,
    item.selectionReason,
    item.taskFrame.goal,
    item.taskFrame.scenario,
    item.taskFrame.constraints.join(' '),
    item.preferenceSignals.join(' '),
    item.selectionSignals.join(' '),
    ...item.candidates.map((candidate) =>
      [candidate.title, candidate.reason, candidate.externalBoundary].filter(Boolean).join(' '),
    ),
  ]
    .filter(Boolean)
    .join(' ')
}

export function resolveTaskDirection(item: RecommendationHistoryItem): ProfileTaskDirection {
  const text = collectDirectionText(item)
  return (
    PROFILE_TASK_DIRECTIONS.find(
      (direction) => direction.id !== 'general' && textIncludesAny(text, direction.keywords),
    ) ?? GENERAL_DIRECTION
  )
}

function uniqueStable(items: string[], limit: number) {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of items) {
    const value = item.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    result.push(value)
    if (result.length >= limit) break
  }
  return result
}

function extractPreferenceSignals(item: RecommendationHistoryItem): string[] {
  const signals = [...item.preferenceSignals, ...item.taskFrame.constraints]
  if (item.taskFrame.budgetPreference === 'free_first') signals.push('免费优先')
  if (item.taskFrame.authPreference === 'no_signup') signals.push('免注册优先')
  if (item.taskFrame.languagePreference === 'chinese') signals.push('中文体验')
  if (item.taskFrame.evidenceRequirement === 'citations') signals.push('要附来源')
  if (item.taskFrame.platformPreference === 'api') signals.push('需要 API')
  if (item.taskFrame.platformPreference === 'mobile') signals.push('移动端优先')
  if (item.taskFrame.urgency === 'fast_start') signals.push('最快上手')
  return signals
}

export function buildProfileMemorySummary(
  items: RecommendationHistoryItem[],
): ProfileMemorySummary {
  const directionMap = new Map<ProfileTaskDirectionId, { count: number; signals: string[] }>()
  const allSignals: string[] = []

  for (const item of items) {
    const direction = resolveTaskDirection(item)
    const signals = extractPreferenceSignals(item)
    allSignals.push(...signals)
    const current = directionMap.get(direction.id) ?? { count: 0, signals: [] }
    current.count += 1
    current.signals.push(...signals)
    directionMap.set(direction.id, current)
  }

  const directionStats = [...directionMap.entries()]
    .map(([id, stat]) => ({
      id,
      label: PROFILE_TASK_DIRECTIONS.find((direction) => direction.id === id)?.label ?? '通用判断',
      count: stat.count,
      signals: uniqueStable(stat.signals, 2),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-Hans-CN'))

  return {
    totalCount: items.length,
    savedCount: items.filter((item) => item.savedToolId).length,
    evaluatedCount: items.filter((item) => item.evaluatedAt).length,
    lowConfidenceCount: items.filter((item) => item.confidenceLevel === 'low').length,
    directionStats,
    preferenceSignals: uniqueStable(allSignals, 8),
  }
}

export function filterProfileHistory(
  items: RecommendationHistoryItem[],
  filters: { directionId: ProfileTaskDirectionId; status: ProfileHistoryStatusFilter },
): RecommendationHistoryItem[] {
  return items.filter((item) => {
    const matchesDirection =
      filters.directionId === 'all' || resolveTaskDirection(item).id === filters.directionId
    if (!matchesDirection) return false
    if (filters.status === 'saved') return Boolean(item.savedToolId)
    if (filters.status === 'evaluated') return Boolean(item.evaluatedAt)
    if (filters.status === 'low_confidence') return item.confidenceLevel === 'low'
    return true
  })
}
