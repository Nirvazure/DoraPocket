import { TOOL_CATEGORY_LABELS, TOOL_CATEGORY_ORDER } from '@/shared/tool-labels'
import type { ToolCategory } from '@/shared/tool-registry'

const MIN_QUERY_LENGTH = 2

export function normalizeMarketSearchQuery(raw: string): string | null {
  const query = raw.trim()
  if (query.length < MIN_QUERY_LENGTH) return null
  return query
}

export function resolveCategoryKeysMatchingQuery(raw: string): ToolCategory[] {
  const normalized = raw.trim().toLowerCase()
  if (!normalized) return []

  return TOOL_CATEGORY_ORDER.filter((category) =>
    TOOL_CATEGORY_LABELS[category].toLowerCase().includes(normalized),
  )
}

export function toIlikePattern(query: string): string {
  return `%${query.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')}%`
}
