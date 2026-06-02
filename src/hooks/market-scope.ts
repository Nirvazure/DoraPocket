import type { PocketInventoryItem } from '@/shared/pocket-types'
import type { MarketReviewAggregate } from '@/shared/market-types'
import { TOOL_CATEGORY_LABELS, TOOL_CATEGORY_ORDER } from '@/shared/tool-labels'
import type { ToolCategory, ToolItem } from '@/shared/tool-registry'

export type MarketScope = 'discover' | 'pocket'
export type MarketSectionKey = 'pocket' | ToolCategory

export type MarketToolCardItem = ToolItem & {
  reviewAggregate: MarketReviewAggregate | null
}

export type MarketNavEntry = readonly [MarketSectionKey, string]

type DiscoverSectionKey = Exclude<MarketSectionKey, 'pocket'>

function createToolGroups() {
  return {
    ai_assistant: [],
    search: [],
    developer: [],
    design: [],
    productivity: [],
    media: [],
    learning: [],
    writing: [],
  } satisfies Record<ToolCategory, MarketToolCardItem[]>
}

function groupTools(tools: MarketToolCardItem[]) {
  return tools.reduce<Record<ToolCategory, MarketToolCardItem[]>>((groups, tool) => {
    groups[tool.category].push(tool)
    return groups
  }, createToolGroups())
}

export function buildActivePocketToolIds(inventory: PocketInventoryItem[]): Set<string> {
  return new Set(inventory.filter((item) => !item.archived).map((item) => item.toolId))
}

export function filterToolsByKeyword(
  tools: MarketToolCardItem[],
  keyword: string,
): MarketToolCardItem[] {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) return tools
  return tools.filter((tool) =>
    `${tool.name} ${tool.description} ${tool.tags.join(' ')} ${TOOL_CATEGORY_LABELS[tool.category]}`
      .toLowerCase()
      .includes(normalized),
  )
}

export function resolveScopedTools(args: {
  scope: MarketScope
  tools: MarketToolCardItem[]
  pocketToolIds: Set<string>
}): MarketToolCardItem[] {
  if (args.scope === 'discover') return args.tools
  return args.tools.filter((tool) => args.pocketToolIds.has(tool.id))
}

export function buildMarketNavigation(args: {
  scopedTools: MarketToolCardItem[]
  pocketToolIds: Set<string>
  allTools: MarketToolCardItem[]
}): {
  pocketCount: number
  categoryEntries: ReadonlyArray<MarketNavEntry>
  categoryCounts: Record<DiscoverSectionKey, number>
} {
  const pocketCount = args.allTools.filter((tool) => args.pocketToolIds.has(tool.id)).length
  const grouped = groupTools(args.scopedTools)

  const categoryCounts = {
    ai_assistant: grouped.ai_assistant.length,
    search: grouped.search.length,
    developer: grouped.developer.length,
    design: grouped.design.length,
    productivity: grouped.productivity.length,
    media: grouped.media.length,
    learning: grouped.learning.length,
    writing: grouped.writing.length,
  } satisfies Record<DiscoverSectionKey, number>

  const discoverEntries: Array<MarketNavEntry> = TOOL_CATEGORY_ORDER.map(
    (category): MarketNavEntry => [category, TOOL_CATEGORY_LABELS[category]],
  )

  const filteredDiscoverEntries = discoverEntries.filter(
    ([key]) => categoryCounts[key as DiscoverSectionKey] > 0,
  )

  return {
    pocketCount,
    categoryEntries: filteredDiscoverEntries,
    categoryCounts,
  }
}

export function resolveMarketSection(args: {
  selectedSection: MarketSectionKey
  categoryEntries: ReadonlyArray<MarketNavEntry>
}): MarketSectionKey {
  const validKeys = new Set(args.categoryEntries.map(([key]) => key))
  if (validKeys.has(args.selectedSection)) return args.selectedSection
  return args.categoryEntries[0]?.[0] ?? 'ai_assistant'
}

export function resolveCurrentTools(args: {
  selectedSection: MarketSectionKey
  scopedTools: MarketToolCardItem[]
}): MarketToolCardItem[] {
  if (args.selectedSection === 'pocket') return args.scopedTools
  const grouped = groupTools(args.scopedTools)
  return grouped[args.selectedSection]
}
