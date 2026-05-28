import type { AgentCandidate } from '@/shared/market-types'
import type { ToolMatch } from '@/shared/tool-registry'

export const HUB_WEAK_SCORE_THRESHOLD = 45
export const EXTERNAL_CONFIDENCE_DEFAULT = 0.72
export const EXTERNAL_CONFIDENCE_HUB_WEAK = 0.65
export const EXTERNAL_CONFIDENCE_PREFER = 0.78
export const MAX_EXTERNAL_SUGGESTIONS = 3

const HUB_RESERVE_WHEN_WEAK = 2

function candidateKey(candidate: AgentCandidate): string {
  if (candidate.toolId) return `tool:${candidate.toolId}`
  return `external:${candidate.title.trim().toLowerCase()}`
}

function sortByScoreDesc(candidates: AgentCandidate[]): AgentCandidate[] {
  return [...candidates].sort((a, b) => b.score - a.score)
}

function dedupeCandidates(candidates: AgentCandidate[]): AgentCandidate[] {
  const seen = new Set<string>()
  const results: AgentCandidate[] = []
  for (const candidate of candidates) {
    const key = candidateKey(candidate)
    if (seen.has(key)) continue
    seen.add(key)
    results.push(candidate)
  }
  return results
}

export function mergeCandidatePool(
  hubCandidates: AgentCandidate[],
  submissionCandidates: AgentCandidate[],
  externalCandidates: AgentCandidate[],
  preferExternal: boolean,
  hubInsufficient = false,
): AgentCandidate[] {
  const externals = externalCandidates.map((candidate, index) => {
    if (preferExternal && index === 0) {
      return { ...candidate, score: candidate.score + 12 }
    }
    return candidate
  })

  if (externals.length === 0) {
    return sortByScoreDesc([...hubCandidates, ...submissionCandidates]).slice(0, 5)
  }

  const hubWeak = hubInsufficient || preferExternal
  if (!hubWeak) {
    return sortByScoreDesc([...hubCandidates, ...submissionCandidates, ...externals]).slice(0, 5)
  }

  const hubPool = sortByScoreDesc([...hubCandidates, ...submissionCandidates])
  const reservedHub = hubPool.slice(0, HUB_RESERVE_WHEN_WEAK)
  const reservedExternals = sortByScoreDesc(externals).slice(0, MAX_EXTERNAL_SUGGESTIONS)
  if (preferExternal && reservedExternals[0]) {
    return dedupeCandidates([
      reservedExternals[0],
      ...reservedHub,
      ...reservedExternals.slice(1),
    ]).slice(0, 5)
  }
  return dedupeCandidates([...reservedHub, ...reservedExternals]).slice(0, 5)
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

function normalizeExternalSuggestionItem(
  raw: unknown,
  matches: ToolMatch[],
  minConfidence: number,
): AgentCandidate | null {
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
  if (!Number.isFinite(confidence) || confidence < minConfidence) return null
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

export function collectExternalSuggestionRaw(parsed: {
  externalSuggestions?: unknown
  externalSuggestion?: unknown
}): unknown[] {
  if (Array.isArray(parsed.externalSuggestions)) return parsed.externalSuggestions
  if (parsed.externalSuggestion != null) return [parsed.externalSuggestion]
  return []
}

export function normalizeExternalSuggestions(
  rawItems: unknown[],
  matches: ToolMatch[],
  minConfidence: number,
  maxCount = MAX_EXTERNAL_SUGGESTIONS,
): AgentCandidate[] {
  const results: AgentCandidate[] = []
  const seenHosts = new Set<string>()
  const seenTitles = new Set<string>()

  for (const raw of rawItems) {
    if (results.length >= maxCount) break
    const suggestion = normalizeExternalSuggestionItem(raw, matches, minConfidence)
    if (!suggestion) continue

    const host = hostnameFor(suggestion.url)
    const title = suggestion.title.trim().toLowerCase()
    if (host && seenHosts.has(host)) continue
    if (seenTitles.has(title)) continue

    if (host) seenHosts.add(host)
    seenTitles.add(title)
    results.push(suggestion)
  }

  return results
}
