import { listActiveToolItems } from '@/server/market/tool-catalog'
import { judgeToolRecommendations } from '@/server/agent/tool-rerank'
import { rankToolItems, type ToolItem, type ToolMatch } from '@/shared/tool-registry'
import type {
  AgentCandidate,
  AgentTaskFrame,
  AgentUiPayload,
  MarketContext,
} from '@/shared/market-types'

export function marketSignalsFromContext(marketContext: MarketContext) {
  return {
    savedToolIds: marketContext.savedItems.map((item) => item.toolId),
    subscribedToolIds: marketContext.subscriptions
      .filter((item) => item.active)
      .map((item) => item.toolId),
    upvotedToolIds: marketContext.feedback
      .filter((item) => item.vote === 'up')
      .map((item) => item.toolId),
    downvotedToolIds: marketContext.feedback
      .filter((item) => item.vote === 'down')
      .map((item) => item.toolId),
    preferredCategories: marketContext.preferenceProfile.preferredCategories,
    preferredTags: marketContext.preferenceProfile.preferredTags,
    preferredPlatforms: marketContext.preferenceProfile.preferredPlatforms,
    preferredPricing: marketContext.preferenceProfile.preferredPricing,
    preferredExecutionModes: marketContext.preferenceProfile.preferredExecutionModes,
    avoidAuthWall: marketContext.preferenceProfile.avoidAuthWall,
    prefersSubscriptionTools: marketContext.preferenceProfile.prefersSubscriptionTools,
  }
}

export function toCandidates(matches: ToolMatch[]): AgentCandidate[] {
  return matches.slice(0, 5).map((match) => ({
    toolId: match.tool.id,
    title: match.tool.name,
    url: match.tool.url,
    candidateType: 'tool',
    score: match.score,
    sourceLabel: match.sourceLabel,
    reason: match.reason,
  }))
}

export function rankSubmissionCandidates(
  userText: string,
  marketContext: MarketContext,
): AgentCandidate[] {
  const lower = userText.trim().toLowerCase()
  if (!lower) return []
  return marketContext.submissions
    .map((item) => {
      const haystack = `${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase()
      let score = 0
      if (haystack.includes(lower)) score += 55
      for (const tag of item.tags) {
        if (lower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(lower)) score += 20
      }
      return {
        toolId: item.id,
        title: item.name,
        url: item.url,
        candidateType: 'submission' as const,
        score,
        sourceLabel: 'market' as const,
        reason: '这是你提交到市场的工具，与当前任务语义存在匹配。',
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

export function defaultSelectionReason(
  taskFrame: AgentTaskFrame,
  topTool: ToolItem | null,
  primaryCandidate?: AgentCandidate | null,
): string {
  if (primaryCandidate?.candidateType === 'external_suggestion') {
    return `${primaryCandidate.title} 是 Hub 外建议：当前 Tool Hub 没有更贴合的沉淀工具，先试这个外部工具更直接。`
  }
  if (!topTool) return '当前没有高置信度工具命中，先走解释型回答。'
  if (topTool.executionMode === 'native_card') {
    return `${topTool.name} 是可直接执行的原生能力，适合当前问题。`
  }
  if (taskFrame.mode === 'discover') {
    return `${topTool.name} 更像外部强项工具，适合被推荐、收藏或订阅，而不是硬塞成内置能力。`
  }
  return `${topTool.name} 与当前任务最匹配。`
}

export function buildRecommendedActions(
  taskFrame: AgentTaskFrame,
  topTool: ToolItem | null,
  primaryCandidate?: AgentCandidate | null,
): string[] {
  if (primaryCandidate?.candidateType === 'external_suggestion') {
    return ['打开外部工具', '试用后判断是否有效', '如有效再提交到 Tool Hub']
  }
  if (!topTool) return ['继续澄清目标', '缩小任务范围', '改用任意门模式再搜一轮']
  const actions =
    topTool.executionMode === 'native_card'
      ? ['直接调用', '收入口袋', '记录调用方式']
      : ['打开工具', '收入口袋', '订阅这个工具']
  if (taskFrame.missingInputs.length > 0) {
    actions.unshift(`补充${taskFrame.missingInputs.join('、')}`)
  }
  return actions
}

export function buildSelectionSignals(
  topTool: ToolItem | null,
  marketContext: MarketContext,
  primaryCandidate?: AgentCandidate | null,
): string[] {
  if (primaryCandidate?.candidateType === 'external_suggestion') {
    return [
      'Hub 外建议',
      primaryCandidate.externalBoundary ?? '当前不在 Tool Hub，不能直接沉淀市场反馈。',
    ].slice(0, 5)
  }
  if (!topTool) return []
  const signals: string[] = []
  if (marketContext.savedItems.some((item) => item.toolId === topTool.id))
    signals.push('你已收藏过它')
  if (marketContext.subscriptions.some((item) => item.active && item.toolId === topTool.id))
    signals.push('你已订阅它')
  if (marketContext.feedback.some((item) => item.toolId === topTool.id && item.vote === 'up'))
    signals.push('你给过正反馈')
  if (marketContext.feedback.some((item) => item.toolId === topTool.id && item.vote === 'down'))
    signals.push('你给过负反馈')
  if (topTool.trustSignals.official) signals.push('官方来源')
  if (topTool.trustSignals.communityVerified) signals.push('社区验证')
  if (topTool.sourceNote) signals.push(topTool.sourceNote)
  return signals.slice(0, 5)
}

export function buildPreferenceSignals(
  topTool: ToolItem | null,
  marketContext: MarketContext,
): string[] {
  if (!topTool) return marketContext.preferenceProfile.summary.slice(0, 3)
  const signals = [...marketContext.preferenceProfile.summary]
  if (marketContext.preferenceProfile.preferredCategories.includes(topTool.category)) {
    signals.push(`命中你的长期偏好类目：${topTool.category}`)
  }
  const matchedTags = topTool.tags
    .filter((tag) => marketContext.preferenceProfile.preferredTags.includes(tag))
    .slice(0, 2)
  if (matchedTags.length > 0) {
    signals.push(`命中你的高频标签：${matchedTags.join(' / ')}`)
  }
  if (marketContext.preferenceProfile.avoidAuthWall && !topTool.requiresAuth) {
    signals.push('符合你偏好低摩擦、免登录工具的习惯')
  }
  if (marketContext.preferenceProfile.prefersSubscriptionTools && topTool.subscriptionSupport) {
    signals.push('符合你把工具沉淀成长线资产的习惯')
  }
  return Array.from(new Set(signals)).slice(0, 5)
}

export function stageLabelFor(
  taskFrame: AgentTaskFrame,
  topTool: ToolItem | null,
  primaryCandidate?: AgentCandidate | null,
): string {
  if (taskFrame.mode === 'answer_book') return '答案之书'
  if (taskFrame.mode === 'manage_pocket') return '整理口袋'
  if (primaryCandidate?.candidateType === 'external_suggestion') return '外部建议'
  if (topTool?.executionMode === 'native_card') return '原生执行'
  if (taskFrame.mode === 'discover') return '发现与排序'
  return '任务分析'
}

export function stageTrailFor(
  taskFrame: AgentTaskFrame,
  topTool: ToolItem | null,
  primaryCandidate?: AgentCandidate | null,
): string[] {
  const trail = ['识别任务']
  if (taskFrame.mode === 'discover') {
    trail.push('召回候选', '排序解释')
    trail.push(
      primaryCandidate?.candidateType === 'external_suggestion'
        ? '外部建议'
        : topTool?.executionMode === 'native_card'
          ? '原生执行'
          : '市场推荐',
    )
  } else if (taskFrame.mode === 'use_builtin') {
    trail.push('命中原生能力', '执行工具')
  } else if (taskFrame.mode === 'manage_pocket') {
    trail.push('整理资产')
  } else if (taskFrame.mode === 'answer_book') {
    trail.push('短答模式')
  } else {
    trail.push('生成建议')
  }
  return trail
}

export function matchingSubmissionLines(userText: string, marketContext: MarketContext): string {
  const lower = userText.trim().toLowerCase()
  if (!lower) return '无'
  const matches = marketContext.submissions
    .filter((item) => {
      const haystack = `${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase()
      return haystack.includes(lower) || item.tags.some((tag) => lower.includes(tag.toLowerCase()))
    })
    .slice(0, 3)
  if (matches.length === 0) return '无'
  return matches.map((item) => `${item.name}：${item.description}`).join('\n')
}

export function formatCandidateLines(candidates: AgentCandidate[]): string {
  if (candidates.length === 0) return '无候选工具。'
  return candidates
    .map((candidate, index) => {
      const boundary =
        candidate.candidateType === 'external_suggestion'
          ? `｜边界：${candidate.externalBoundary ?? '不在 Tool Hub，不能直接沉淀市场反馈'}`
          : ''
      return `${index + 1}. ${candidate.title}｜来源：${candidate.sourceLabel}｜理由：${candidate.reason}${boundary}`
    })
    .join('\n')
}

export async function buildRankedCandidates(
  userText: string,
  marketContext: MarketContext,
  taskFrame?: AgentTaskFrame,
) {
  const toolItems = await listActiveToolItems()
  const initialMatches = rankToolItems(toolItems, userText, marketSignalsFromContext(marketContext))
  const judgement =
    taskFrame?.mode === 'discover'
      ? await judgeToolRecommendations(userText, initialMatches).catch(() => ({
          matches: initialMatches,
          externalSuggestion: null,
          preferExternal: false,
          selectionReason: undefined,
        }))
      : {
          matches: initialMatches,
          externalSuggestion: null,
          preferExternal: false,
          selectionReason: undefined,
        }
  const hubCandidates = toCandidates(judgement.matches)
  const submissionCandidates = rankSubmissionCandidates(userText, marketContext)
  const externalCandidates = judgement.externalSuggestion ? [judgement.externalSuggestion] : []
  const candidates = (
    judgement.preferExternal
      ? [...externalCandidates, ...hubCandidates, ...submissionCandidates]
      : [
          ...[...hubCandidates, ...submissionCandidates].sort((a, b) => b.score - a.score),
          ...externalCandidates,
        ]
  ).slice(0, 5)
  const primaryCandidate = candidates[0] ?? null
  const topTool =
    primaryCandidate?.candidateType === 'tool' && primaryCandidate.toolId
      ? (judgement.matches.find((match) => match.tool.id === primaryCandidate.toolId)?.tool ?? null)
      : null

  return {
    matches: judgement.matches,
    candidates,
    topTool,
    primaryCandidate,
    selectionReason: judgement.selectionReason,
  }
}

export function buildAgentUiPayload(
  taskFrame: AgentTaskFrame,
  topTool: ToolItem | null,
  candidates: AgentCandidate[],
  selectionReason: string,
  marketContext: MarketContext,
  primaryCandidate?: AgentCandidate | null,
): AgentUiPayload {
  return {
    stageLabel: stageLabelFor(taskFrame, topTool, primaryCandidate),
    stageTrail: stageTrailFor(taskFrame, topTool, primaryCandidate),
    taskFrame,
    candidates,
    selectionReason,
    selectionSignals: buildSelectionSignals(topTool, marketContext, primaryCandidate),
    preferenceSignals: buildPreferenceSignals(topTool, marketContext),
    recommendedActions: buildRecommendedActions(taskFrame, topTool, primaryCandidate),
    shouldAutoSave: Boolean(
      topTool &&
      primaryCandidate?.candidateType !== 'external_suggestion' &&
      (topTool.executionMode === 'native_card' || taskFrame.mode === 'discover'),
    ),
  }
}
