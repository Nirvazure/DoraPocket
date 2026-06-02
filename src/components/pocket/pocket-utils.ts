import type { ToolCategory } from '@/shared/tool-registry'
import type { PocketInventoryItem } from '@/shared/pocket-types'
import type { ToolItem } from '@/shared/tool-registry'
import { TOOL_CATEGORY_LABELS, TOOL_CATEGORY_ORDER } from '@/shared/tool-labels'

export type PocketCategoryFilter = 'all' | ToolCategory

export function getPocketCategoryLabel(category: PocketCategoryFilter) {
  if (category === 'all') return '全部'
  return TOOL_CATEGORY_LABELS[category]
}

export function getPocketAvailableCategories(
  items: PocketInventoryItem[],
  getTool: (toolId: string) => ToolItem | null = () => null,
) {
  const categories = new Set<ToolCategory>()

  for (const item of items) {
    const tool = getTool(item.toolId)
    if (tool) categories.add(tool.category)
  }

  return TOOL_CATEGORY_ORDER.filter((category) => categories.has(category))
}

export function filterPocketItems(
  items: PocketInventoryItem[],
  query: string,
  category: PocketCategoryFilter,
  getTool: (toolId: string) => ToolItem | null = () => null,
) {
  const keyword = query.trim().toLowerCase()

  return items.filter((item) => {
    const tool = getTool(item.toolId)
    if (!tool) return false
    if (item.archived) return false
    if (category !== 'all' && tool.category !== category) return false
    if (!keyword) return true

    return `${tool.name} ${tool.description} ${tool.tags.join(' ')} ${getPocketCategoryLabel(tool.category)}`
      .toLowerCase()
      .includes(keyword)
  })
}

export function getPocketStats(
  items: PocketInventoryItem[],
  getTool: (toolId: string) => ToolItem | null = () => null,
) {
  const activeItems = items.filter((item) => !item.archived)

  return {
    total: activeItems.length,
    categories: getPocketAvailableCategories(activeItems, getTool).length,
  }
}
