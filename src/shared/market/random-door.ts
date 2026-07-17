import type { AgentUiPayload } from '@/shared/market/market-types'
import type { ToolCategory, ToolItem } from '@/shared/market/tool-registry'

export type RandomDoorRecommendation = {
  tool: ToolItem
  reason: string
  poolSize: number
}

export type RandomDoorAnalysisPayload = {
  selectedToolPayload: {
    toolId: string
    args: Record<string, unknown>
  }
  uiPayload: AgentUiPayload
}

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  ai_assistant: 'AI 助手',
  search: '搜索',
  developer: '开发',
  design: '设计',
  productivity: '效率',
  media: '内容',
  learning: '学习',
  writing: '写作',
}

const REASON_TEMPLATES = [
  (tool: ToolItem) => `这扇门把你带到 ${tool.name}，适合先从一个直接可用的工具开始。`,
  (tool: ToolItem) => `它在「${CATEGORY_LABELS[tool.category]}」方向很顺手，先试它通常不会太绕。`,
  (tool: ToolItem) =>
    tool.tags.length > 0
      ? `它的标签里有 ${tool.tags.slice(0, 2).join('、')}，很适合随机开一把。`
      : `它是一个比较稳的 Tool Hub 选择，适合当作今天的起点。`,
]

export function isRandomDoorEligible(tool: Pick<ToolItem, 'status' | 'url' | 'executionMode'>) {
  return (
    tool.status === 'active' && Boolean(tool.url?.trim()) && tool.executionMode !== 'reference_only'
  )
}

export function buildRandomDoorReason(tool: ToolItem): string {
  const index =
    (tool.tags.length + tool.category.length + tool.name.length) % REASON_TEMPLATES.length
  return REASON_TEMPLATES[index](tool)
}

export function pickRandomDoorRecommendation(
  tools: ToolItem[],
  rng: () => number = Math.random,
): RandomDoorRecommendation | null {
  const eligibleTools = tools.filter(isRandomDoorEligible)
  if (eligibleTools.length === 0) return null

  const index = Math.min(eligibleTools.length - 1, Math.floor(rng() * eligibleTools.length))
  const tool = eligibleTools[index]

  return {
    tool,
    reason: buildRandomDoorReason(tool),
    poolSize: eligibleTools.length,
  }
}

export function buildRandomDoorAnalysisPayload({
  tool,
  reason,
  poolSize,
}: RandomDoorRecommendation): RandomDoorAnalysisPayload {
  const topTags = tool.tags.slice(0, 3)
  const tagSummary = topTags.length > 0 ? `标签：${topTags.join('、')}` : '暂无标签'

  return {
    selectedToolPayload: {
      toolId: tool.id,
      args: {
        source: 'random-door',
      },
    },
    uiPayload: {
      stageLabel: '任意门',
      stageTrail: ['随机发现', CATEGORY_LABELS[tool.category], tool.name],
      taskFrame: {
        goal: '任意门随机推荐',
        mode: 'discover',
        missingInputs: [],
        constraints: ['随机发现一个可立即打开的工具'],
        confidenceDrivers: ['工具当前可用', `随机池共有 ${poolSize} 个可开门工具`, tagSummary],
      },
      candidates: [
        {
          toolId: tool.id,
          title: tool.name,
          url: tool.url,
          candidateType: 'tool',
          assetOrigin: tool.source === 'official' ? 'bookmark_seed' : 'curated_market',
          score: 1,
          sourceLabel: 'market',
          reason,
        },
      ],
      selectionReason: reason,
      decisionSummary: `任意门这次开到了 ${tool.name}。`,
      whyThisFirst: [reason, `它来自 ${poolSize} 个当前可打开工具组成的随机池。`],
      whyNotAlternatives: {},
      riskNotes: ['这是随机发现，不代表它一定最适合你当前任务。'],
      trustEvidence: tool.trustSignals.curated ? ['已进入 DoraPocket 工具库'] : [],
      communityEvidence:
        tool.usageStats.saves > 0 ? [`已有 ${tool.usageStats.saves} 次收藏记录`] : [],
      personalEvidence: [],
      evaluationPrompt: '这个随机工具值得继续放进口袋吗？',
      selectionSignals: [`随机池规模 ${poolSize}`, CATEGORY_LABELS[tool.category], ...topTags],
      preferenceSignals: [],
      recommendedActions: ['打开工具试试看', '如果顺手就收进口袋'],
      recallSummary: null,
      confidenceLevel: 'normal',
    },
  }
}
