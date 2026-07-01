import { mergeCandidatePool } from '@/shared/discovery/candidate-pool'
import { type ToolItem, type ToolMatch } from '@/shared/market/tool-registry'
import type {
  AgentCandidate,
  AgentTaskFrame,
  AgentUiPayload,
  MarketContext,
  RecallSummary,
} from '@/shared/market/market-types'

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
    .filter((item) => item.status !== 'duplicate')
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
  if (taskFrame.mode === 'discover') {
    return `${topTool.name} 与当前任务较匹配，适合作为本次首选。`
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
  if (!topTool) return ['继续澄清目标', '缩小任务范围', '换个说法再搜一轮']
  const actions = ['打开工具', '收入口袋', '订阅这个工具']
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

function buildDecisionSummary(
  primaryCandidate?: AgentCandidate | null,
  topTool?: ToolItem | null,
): string {
  const name = topTool?.name ?? primaryCandidate?.title
  return name ? `这次先试 ${name}。` : '这次先缩小任务范围再推荐。'
}

function buildWhyThisFirst(
  selectionReason: string,
  primaryCandidate?: AgentCandidate | null,
): string[] {
  return [primaryCandidate?.reason, selectionReason]
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 3)
}

function buildWhyNotAlternatives(candidates: AgentCandidate[]): Record<string, string> {
  return Object.fromEntries(
    candidates
      .slice(1, 4)
      .map((candidate) => [
        candidate.toolId ?? candidate.title,
        candidate.reason || '这次适合作为备选，但不是最先试的方向。',
      ]),
  )
}

function buildRiskNotes(taskFrame: AgentTaskFrame, topTool: ToolItem | null): string[] {
  if (!topTool) return []
  const notes: string[] = []
  if (taskFrame.authPreference === 'no_signup' && topTool.requiresAuth) {
    notes.push('需要注册或登录，可能不符合免注册优先。')
  }
  if (
    taskFrame.budgetPreference === 'free_first' &&
    topTool.pricingModel !== 'free' &&
    topTool.pricingModel !== 'freemium'
  ) {
    notes.push('不是免费优先方案，试用前需要确认价格。')
  }
  if (taskFrame.platformPreference === 'api' && topTool.platform !== 'api') {
    notes.push('当前不是 API 优先方案，集成前需要再确认能力边界。')
  }
  return notes.slice(0, 3)
}

function buildCommunityEvidence(topTool: ToolItem | null, marketContext: MarketContext): string[] {
  if (!topTool) return []
  const reviews = marketContext.feedback.filter((item) => item.toolId === topTool.id)
  const positiveReviews = reviews.filter((item) => item.vote === 'up')
  const evidence: string[] = []
  if (reviews.length > 0) {
    const average = reviews.reduce((sum, item) => sum + item.starRating, 0) / reviews.length
    evidence.push(`${reviews.length} 条体验反馈，平均 ${average.toFixed(1)} 星。`)
  }
  const topTags = positiveReviews.flatMap((item) => item.selectedTags).slice(0, 3)
  if (topTags.length > 0) evidence.push(`正向标签：${topTags.join(' / ')}。`)
  return evidence.slice(0, 3)
}

function buildPersonalEvidence(topTool: ToolItem | null, marketContext: MarketContext): string[] {
  if (!topTool) return []
  const evidence: string[] = []
  if (marketContext.savedItems.some((item) => item.toolId === topTool.id)) {
    evidence.push('你已经收藏过它。')
  }
  if (marketContext.subscriptions.some((item) => item.active && item.toolId === topTool.id)) {
    evidence.push('你已经订阅过它。')
  }
  const review = marketContext.feedback.find((item) => item.toolId === topTool.id)
  if (review) evidence.push(`你曾给过 ${review.starRating} 星反馈。`)
  return evidence.slice(0, 3)
}

export function stageLabelFor(
  taskFrame: AgentTaskFrame,
  topTool: ToolItem | null,
  primaryCandidate?: AgentCandidate | null,
): string {
  if (taskFrame.mode === 'manage_pocket') return '整理口袋'
  if (primaryCandidate?.candidateType === 'external_suggestion') return '外部建议'
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
    trail.push(primaryCandidate?.candidateType === 'external_suggestion' ? '外部建议' : '市场推荐')
  } else if (taskFrame.mode === 'manage_pocket') {
    trail.push('整理资产')
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
  const { recallToolMatchesFromCatalog } = await import('@/server/retrieval/tool-recall')
  const { matches: initialMatches, recallSummary } = await recallToolMatchesFromCatalog(userText, {
    ...marketSignalsFromContext(marketContext),
  })
  const judgement =
    taskFrame?.mode === 'discover'
      ? await import('@/server/agent/tool-rerank')
          .then(({ judgeToolRecommendations }) =>
            judgeToolRecommendations(userText, initialMatches),
          )
          .catch(() => ({
            matches: initialMatches,
            externalSuggestions: [],
            preferExternal: false,
            hubInsufficient: false,
            selectionReason: undefined,
          }))
      : {
          matches: initialMatches,
          externalSuggestions: [],
          preferExternal: false,
          hubInsufficient: false,
          selectionReason: undefined,
        }
  const hubCandidates = toCandidates(judgement.matches)
  const submissionCandidates = rankSubmissionCandidates(userText, marketContext)
  const externalCandidates = judgement.externalSuggestions ?? []
  const candidates = mergeCandidatePool(
    hubCandidates,
    submissionCandidates,
    externalCandidates,
    judgement.preferExternal,
    judgement.hubInsufficient,
  )
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
    recallSummary,
  }
}

export function buildAgentUiPayload(
  taskFrame: AgentTaskFrame,
  topTool: ToolItem | null,
  candidates: AgentCandidate[],
  selectionReason: string,
  marketContext: MarketContext,
  primaryCandidate?: AgentCandidate | null,
  recallSummary?: RecallSummary | null,
): AgentUiPayload {
  const selectionSignals = buildSelectionSignals(topTool, marketContext, primaryCandidate)
  const preferenceSignals = buildPreferenceSignals(topTool, marketContext)
  return {
    stageLabel: stageLabelFor(taskFrame, topTool, primaryCandidate),
    stageTrail: stageTrailFor(taskFrame, topTool, primaryCandidate),
    taskFrame,
    candidates,
    selectionReason,
    decisionSummary: buildDecisionSummary(primaryCandidate, topTool),
    whyThisFirst: buildWhyThisFirst(selectionReason, primaryCandidate),
    whyNotAlternatives: buildWhyNotAlternatives(candidates),
    riskNotes: buildRiskNotes(taskFrame, topTool),
    trustEvidence: selectionSignals,
    communityEvidence: buildCommunityEvidence(topTool, marketContext),
    personalEvidence: buildPersonalEvidence(topTool, marketContext),
    evaluationPrompt: '试完后告诉我这次推荐准不准，我会用它校准下一次。',
    selectionSignals,
    preferenceSignals,
    recommendedActions: buildRecommendedActions(taskFrame, topTool, primaryCandidate),
    recallSummary: recallSummary ?? null,
  }
}
