import 'server-only'

import { invokeModel } from '@/server/agent/model'
import type { AgentCandidate } from '@/shared/market-types'
import {
  collectExternalSuggestionRaw,
  EXTERNAL_CONFIDENCE_DEFAULT,
  EXTERNAL_CONFIDENCE_HUB_WEAK,
  EXTERNAL_CONFIDENCE_PREFER,
  normalizeExternalSuggestions,
} from '@/shared/candidate-pool'
import type { ToolMatch } from '@/shared/tool-registry'

function extractJsonArray(text: string): unknown[] {
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { ranking?: unknown }).ranking)
    ) {
      return (parsed as { ranking: unknown[] }).ranking
    }
  } catch {
    // Continue with loose JSON extraction.
  }
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1))
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export type ToolRecommendationJudgement = {
  matches: ToolMatch[]
  externalSuggestions: AgentCandidate[]
  preferExternal: boolean
  hubInsufficient: boolean
  selectionReason?: string
}

export {
  EXTERNAL_CONFIDENCE_DEFAULT,
  EXTERNAL_CONFIDENCE_HUB_WEAK,
  EXTERNAL_CONFIDENCE_PREFER,
  HUB_WEAK_SCORE_THRESHOLD,
  MAX_EXTERNAL_SUGGESTIONS,
  normalizeExternalSuggestions,
} from '@/shared/candidate-pool'

export async function judgeToolRecommendations(
  query: string,
  matches: ToolMatch[],
): Promise<ToolRecommendationJudgement> {
  const rerankable = matches.slice(0, 10)
  const rest = matches.slice(10)
  const prompt = [
    '你是 DoraPocket 的工具推荐裁决器。Tool Hub 是优先资产池，但不是推荐上限。',
    '目标：用户输入问题后，选出此刻最值得先用的帮助。',
    '你必须先重排给定 Hub 候选，不能新增 Hub 工具。',
    '如果 Hub 候选明显不足或不相关，可以额外给出 1 到 3 个 externalSuggestions。',
    '外部建议必须是用户可直接打开的真实 http/https URL；不确定就返回空数组。',
    '排序依据：适配度、可启动性、成功率、复用价值、信任感。不要只看热度。',
    '输出可解析 JSON，不要输出 Markdown。格式：{"ranking":[{"toolId":"...","reason":"..."}],"externalSuggestions":[{"title":"...","url":"https://...","reason":"...","externalBoundary":"...","externalConfidence":0.0}],"preferExternal":false,"hubInsufficient":false,"selectionReason":"..."}。',
    '当 Hub 候选明显不相关时，hubInsufficient 设为 true，并尽量给出 2 到 3 个高质量外部建议。',
    '只有当外部建议明显比 Hub 首选更适合且 externalConfidence >= 0.78 时，preferExternal 才能为 true。',
    `用户问题：${query}`,
    `Hub 候选工具：${JSON.stringify(
      rerankable.map((match) => ({
        toolId: match.tool.id,
        name: match.tool.name,
        description: match.tool.description,
        category: match.tool.category,
        tags: match.tool.tags,
        capabilities: match.tool.capabilities,
        pricingModel: match.tool.pricingModel,
        requiresAuth: match.tool.requiresAuth,
        currentScore: match.score,
      })),
    )}`,
  ].join('\n')

  const response = await invokeModel(prompt, '你只输出可解析 JSON。', 0.1)
  let parsed: {
    ranking?: unknown[]
    externalSuggestions?: unknown
    externalSuggestion?: unknown
    preferExternal?: unknown
    hubInsufficient?: unknown
    selectionReason?: unknown
  } = {}
  try {
    const raw = JSON.parse(response)
    if (raw && typeof raw === 'object') {
      parsed = raw as typeof parsed
    }
  } catch {
    parsed = { ranking: extractJsonArray(response) }
  }
  const ranking = Array.isArray(parsed.ranking) ? parsed.ranking : extractJsonArray(response)
  const byId = new Map(rerankable.map((match) => [match.tool.id, match]))
  const used = new Set<string>()
  const next: ToolMatch[] = []

  for (const item of ranking) {
    if (!item || typeof item !== 'object') continue
    const raw = item as { toolId?: unknown; reason?: unknown }
    if (typeof raw.toolId !== 'string') continue
    const match = byId.get(raw.toolId)
    if (!match || used.has(raw.toolId)) continue
    used.add(raw.toolId)
    next.push({
      ...match,
      reason:
        typeof raw.reason === 'string' && raw.reason.trim() ? raw.reason.trim() : match.reason,
    })
  }

  for (const match of rerankable) {
    if (!used.has(match.tool.id)) next.push(match)
  }

  const orderedMatches = [...next, ...rest]
  const hubInsufficient = parsed.hubInsufficient === true
  const minConfidence = hubInsufficient ? EXTERNAL_CONFIDENCE_HUB_WEAK : EXTERNAL_CONFIDENCE_DEFAULT
  const externalSuggestions = normalizeExternalSuggestions(
    collectExternalSuggestionRaw(parsed),
    orderedMatches,
    minConfidence,
  )
  const firstExternal = externalSuggestions[0] ?? null
  const preferExternal =
    firstExternal != null &&
    parsed.preferExternal === true &&
    (firstExternal.externalConfidence ?? 0) >= EXTERNAL_CONFIDENCE_PREFER

  return {
    matches: orderedMatches,
    externalSuggestions,
    preferExternal,
    hubInsufficient,
    selectionReason:
      typeof parsed.selectionReason === 'string' && parsed.selectionReason.trim()
        ? parsed.selectionReason.trim()
        : undefined,
  }
}
