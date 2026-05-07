import 'server-only'

import { invokeModel } from '@/server/agent/model'
import type { AgentCandidate } from '@/shared/market-types'
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

type ToolRecommendationJudgement = {
  matches: ToolMatch[]
  externalSuggestion: AgentCandidate | null
  preferExternal: boolean
  selectionReason?: string
}

function normalizeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

function hostnameFor(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

function isDuplicateExternalSuggestion(suggestion: AgentCandidate, matches: ToolMatch[]): boolean {
  const externalHost = hostnameFor(suggestion.url)
  const externalTitle = suggestion.title.trim().toLowerCase()
  return matches.some((match) => {
    const toolHost = hostnameFor(match.tool.url)
    return (
      (externalHost != null && toolHost === externalHost) ||
      match.tool.name.trim().toLowerCase() === externalTitle
    )
  })
}

function normalizeExternalSuggestion(raw: unknown, matches: ToolMatch[]): AgentCandidate | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as {
    title?: unknown
    url?: unknown
    reason?: unknown
    externalBoundary?: unknown
    externalConfidence?: unknown
  }
  if (typeof item.title !== 'string' || !item.title.trim()) return null
  const url = normalizeExternalUrl(item.url)
  if (!url) return null
  const confidence =
    typeof item.externalConfidence === 'number'
      ? item.externalConfidence
      : Number(item.externalConfidence)
  if (!Number.isFinite(confidence) || confidence < 0.72) return null
  const suggestion: AgentCandidate = {
    title: item.title.trim(),
    url,
    candidateType: 'external_suggestion',
    score: Math.round(confidence * 100),
    sourceLabel: 'external',
    reason:
      typeof item.reason === 'string' && item.reason.trim()
        ? item.reason.trim()
        : 'Tool Hub 当前没有足够贴合的候选，这是一个 Hub 外建议。',
    externalBoundary:
      typeof item.externalBoundary === 'string' && item.externalBoundary.trim()
        ? item.externalBoundary.trim()
        : '当前不在 Tool Hub，不能直接沉淀市场反馈。',
    externalConfidence: confidence,
  }
  return isDuplicateExternalSuggestion(suggestion, matches) ? null : suggestion
}

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
    '如果 Hub 候选明显不足，但你非常确定一个更合适的外部工具，可以额外给出 1 个 externalSuggestion。',
    '外部建议必须是用户可直接打开的真实 http/https URL；不确定就返回 null。',
    '排序依据：适配度、可启动性、成功率、复用价值、信任感。不要只看热度。',
    '输出可解析 JSON，不要输出 Markdown。格式：{"ranking":[{"toolId":"...","reason":"..."}],"externalSuggestion":{"title":"...","url":"https://...","reason":"...","externalBoundary":"...","externalConfidence":0.0},"preferExternal":false,"selectionReason":"..."}。',
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
    externalSuggestion?: unknown
    preferExternal?: unknown
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
  const externalSuggestion = normalizeExternalSuggestion(parsed.externalSuggestion, orderedMatches)
  const preferExternal =
    externalSuggestion != null &&
    parsed.preferExternal === true &&
    (externalSuggestion.externalConfidence ?? 0) >= 0.78

  return {
    matches: orderedMatches,
    externalSuggestion,
    preferExternal,
    selectionReason:
      typeof parsed.selectionReason === 'string' && parsed.selectionReason.trim()
        ? parsed.selectionReason.trim()
        : undefined,
  }
}
