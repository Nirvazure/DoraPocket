'use client'

import { useMemo, useState } from 'react'
import { type ToolCategory, type ToolItem } from '@/services/tool-registry'
import { TOOL_CATEGORY_LABELS, TOOL_CATEGORY_ORDER } from '@/shared/tool-labels'
import { PAGE_COPY } from '@/shared/ui-copy'

type CategoryKey = 'builtin' | ToolCategory

type Draft = {
  name: string
  url: string
  description: string
  tags: string
}

export const EMPTY_MARKET_DRAFT: Draft = {
  name: '',
  url: '',
  description: '',
  tags: '',
}

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
  } satisfies Record<ToolCategory, ToolItem[]>
}

function groupTools(tools: ToolItem[]) {
  return tools.reduce<Record<ToolCategory, ToolItem[]>>((groups, tool) => {
    groups[tool.category].push(tool)
    return groups
  }, createToolGroups())
}

export function useMarketPageModel(
  toolsSource: ToolItem[],
  submitMarketTool: (input: {
    name: string
    url: string
    description: string
    tags: string[]
  }) => void,
) {
  const [query, setQuery] = useState('')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY_MARKET_DRAFT)
  const [selectedSection, setSelectedSection] = useState<'builtin' | ToolCategory>('builtin')

  const keyword = query.trim().toLowerCase()
  const tools = useMemo(() => {
    if (!keyword) return toolsSource
    return toolsSource.filter((tool) =>
      `${tool.name} ${tool.description} ${tool.tags.join(' ')} ${TOOL_CATEGORY_LABELS[tool.category]}`
        .toLowerCase()
        .includes(keyword),
    )
  }, [keyword, toolsSource])

  const builtinTools = useMemo(() => tools.filter((tool) => tool.source === 'builtin'), [tools])
  const marketTools = useMemo(() => tools.filter((tool) => tool.source !== 'builtin'), [tools])
  const grouped = useMemo(() => groupTools(marketTools), [marketTools])

  const categoryCounts = useMemo<Record<CategoryKey, number>>(
    () => ({
      builtin: builtinTools.length,
      ai_assistant: grouped.ai_assistant.length,
      search: grouped.search.length,
      developer: grouped.developer.length,
      design: grouped.design.length,
      productivity: grouped.productivity.length,
      media: grouped.media.length,
      learning: grouped.learning.length,
      writing: grouped.writing.length,
    }),
    [builtinTools.length, grouped],
  )

  const categoryEntries = useMemo((): ReadonlyArray<readonly [CategoryKey, string]> => {
    const entries: Array<readonly [CategoryKey, string]> = [
      ['builtin', PAGE_COPY.market.builtinSection],
      ...TOOL_CATEGORY_ORDER.map(
        (category): readonly [CategoryKey, string] => [category, TOOL_CATEGORY_LABELS[category]],
      ),
    ]
    return entries.filter(([key]) => categoryCounts[key] > 0)
  }, [categoryCounts])

  const resolvedSection = useMemo(() => {
    const validKeys = new Set(categoryEntries.map(([key]) => key))
    return validKeys.has(selectedSection) ? selectedSection : (categoryEntries[0]?.[0] ?? 'builtin')
  }, [categoryEntries, selectedSection])

  const currentCategoryTools = resolvedSection === 'builtin' ? builtinTools : grouped[resolvedSection]

  const submitDraft = () => {
    if (!draft.name.trim() || !draft.url.trim() || !draft.description.trim()) return
    submitMarketTool({
      name: draft.name,
      url: draft.url,
      description: draft.description,
      tags: draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    })
    setDraft(EMPTY_MARKET_DRAFT)
    setSubmitOpen(false)
  }

  return {
    query,
    setQuery,
    submitOpen,
    setSubmitOpen,
    draft,
    setDraft,
    selectedSection: resolvedSection,
    setSelectedSection,
    categoryEntries,
    categoryCounts,
    currentCategoryTools,
    submitDraft,
  }
}
