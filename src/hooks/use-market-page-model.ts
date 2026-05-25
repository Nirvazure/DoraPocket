'use client'

import { useMemo, useState } from 'react'
import type { MarketReviewAggregate } from '@/shared/market-types'
import { type ToolItem } from '@/shared/tool-registry'
import {
  buildMarketNavigation,
  filterToolsByKeyword,
  resolveCurrentTools,
  resolveMarketSection,
  resolveScopedTools,
  type MarketScope,
  type MarketSectionKey,
  type MarketToolCardItem,
} from '@/hooks/market-scope'

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

export type { MarketScope, MarketSectionKey, MarketToolCardItem }

type DiscoverSectionKey = Exclude<MarketSectionKey, 'pocket'>

type UseMarketPageModelOptions = {
  pocketToolIds: Set<string>
  initialSection?: MarketSectionKey | null
}

export function useMarketPageModel(
  toolsSource: ToolItem[],
  reviewAggregates: Record<string, MarketReviewAggregate>,
  submitMarketTool: (input: {
    name: string
    url: string
    description: string
    tags: string[]
  }) => void,
  options: UseMarketPageModelOptions,
) {
  const { pocketToolIds, initialSection = null } = options
  const [query, setQuery] = useState('')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY_MARKET_DRAFT)
  const [marketScope, setMarketScope] = useState<MarketScope>(
    initialSection === 'pocket' ? 'pocket' : 'discover',
  )
  const [selectedSection, setSelectedSection] = useState<MarketSectionKey>(
    initialSection === 'pocket' ? 'pocket' : 'ai_assistant',
  )
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [reviewToolId, setReviewToolId] = useState<string | null>(null)

  const tools = useMemo<MarketToolCardItem[]>(() => {
    const enriched = toolsSource.map((tool) => ({
      ...tool,
      reviewAggregate: reviewAggregates[tool.id] ?? null,
    }))
    return filterToolsByKeyword(enriched, query)
  }, [query, reviewAggregates, toolsSource])

  const scopedTools = useMemo(
    () => resolveScopedTools({ scope: marketScope, tools, pocketToolIds }),
    [marketScope, pocketToolIds, tools],
  )

  const navigation = useMemo(
    () => buildMarketNavigation({ scopedTools, pocketToolIds, allTools: tools }),
    [pocketToolIds, scopedTools, tools],
  )

  const resolvedSection = useMemo(
    () =>
      resolveMarketSection({
        selectedSection,
        categoryEntries: navigation.categoryEntries,
        marketScope,
      }),
    [marketScope, navigation.categoryEntries, selectedSection],
  )

  const currentCategoryTools = useMemo(
    () => resolveCurrentTools({ selectedSection: resolvedSection, scopedTools }),
    [resolvedSection, scopedTools],
  )

  const reviewTool = useMemo(
    () => tools.find((tool) => tool.id === reviewToolId) ?? null,
    [reviewToolId, tools],
  )

  const setScope = (scope: MarketScope) => {
    if (scope === marketScope) return
    if (scope === 'pocket') {
      setMarketScope('pocket')
      setSelectedSection('pocket')
      return
    }
    setMarketScope('discover')
    if (selectedSection === 'pocket') {
      setSelectedSection(navigation.categoryEntries[0]?.[0] ?? 'ai_assistant')
    }
  }

  const selectSection = (key: DiscoverSectionKey) => {
    setSelectedSection(key)
  }

  const submitDraft = () => {
    if (!draft.name.trim() || !draft.url.trim() || !draft.description.trim()) return
    submitMarketTool({
      name: draft.name,
      url: draft.url,
      description: draft.description,
      tags: draft.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
    setDraft(EMPTY_MARKET_DRAFT)
    setSubmitOpen(false)
  }

  const discoverCategoryEntries = navigation.categoryEntries as ReadonlyArray<
    readonly [DiscoverSectionKey, string]
  >

  return {
    query,
    setQuery,
    submitOpen,
    setSubmitOpen,
    draft,
    setDraft,
    sidebarCollapsed,
    setSidebarCollapsed,
    marketScope,
    setScope,
    selectedSection: resolvedSection,
    selectSection,
    categoryEntries: discoverCategoryEntries,
    categoryCounts: navigation.categoryCounts,
    pocketCount: navigation.pocketCount,
    currentCategoryTools,
    reviewTool,
    reviewOpen: reviewTool != null,
    openReviewTool: setReviewToolId,
    closeReviewTool: () => setReviewToolId(null),
    submitDraft,
  }
}
