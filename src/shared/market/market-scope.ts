import type { MarketReviewAggregate } from '@/shared/market/market-types'
import { TOOL_CATEGORY_LABELS, TOOL_CATEGORY_ORDER } from '@/shared/market/tool-labels'
import type { ToolCategory, ToolItem } from '@/shared/market/tool-registry'
import type { PocketInventoryItem } from '@/shared/user/pocket-types'

export type MarketScope = 'discover' | 'pocket'
export type MarketSectionKey = 'discover_home' | 'pocket' | ToolCategory
export type MarketDiscoverSectionKey = Exclude<MarketSectionKey, 'pocket'>

export type MarketToolCardItem = ToolItem & {
  reviewAggregate: MarketReviewAggregate | null
}

export type MarketNavEntry = readonly [MarketSectionKey, string]
export const DISCOVER_HOME_SECTION_KEY = 'discover_home' as const
export const DISCOVER_HOME_SECTION_LABEL = '发现首页'

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
  categoryCounts: Record<ToolCategory, number>
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
  } satisfies Record<ToolCategory, number>

  const discoverEntries: Array<MarketNavEntry> = TOOL_CATEGORY_ORDER.map(
    (category): MarketNavEntry => [category, TOOL_CATEGORY_LABELS[category]],
  )

  const filteredDiscoverEntries = discoverEntries.filter(
    ([key]) => categoryCounts[key as ToolCategory] > 0,
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
  return args.categoryEntries[0]?.[0] ?? DISCOVER_HOME_SECTION_KEY
}

export function resolveCurrentTools(args: {
  selectedSection: MarketSectionKey
  scopedTools: MarketToolCardItem[]
}): MarketToolCardItem[] {
  if (args.selectedSection === 'pocket' || args.selectedSection === DISCOVER_HOME_SECTION_KEY) {
    return args.scopedTools
  }
  const grouped = groupTools(args.scopedTools)
  return grouped[args.selectedSection]
}
