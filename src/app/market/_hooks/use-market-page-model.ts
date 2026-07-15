'use client'

import { useMemo, useState } from 'react'
import type { MarketReviewAggregate } from '@/shared/market/market-types'
import { type ToolItem } from '@/shared/market/tool-registry'
import {
  buildMarketNavigation,
  DISCOVER_HOME_SECTION_KEY,
  DISCOVER_HOME_SECTION_LABEL,
  resolveCurrentTools,
  resolveMarketSection,
  resolveScopedTools,
  type MarketDiscoverSectionKey,
  type MarketScope,
  type MarketSectionKey,
  type MarketToolCardItem,
} from '@/shared/market/market-scope'

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

export type {
  MarketScope,
  MarketSectionKey,
  MarketToolCardItem,
} from '@/shared/market/market-scope'

type UseMarketPageModelOptions = {
  pocketToolIds: Set<string>
  initialSection?: MarketSectionKey | null
  query: string
  onQueryChange: (value: string) => void
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
  const { pocketToolIds, initialSection = null, query, onQueryChange } = options
  const [submitOpen, setSubmitOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY_MARKET_DRAFT)
  const [marketScope, setMarketScope] = useState<MarketScope>(
    initialSection === 'pocket' ? 'pocket' : 'discover',
  )
  const [selectedSection, setSelectedSection] = useState<MarketSectionKey>(
    initialSection && initialSection !== 'pocket' ? initialSection : DISCOVER_HOME_SECTION_KEY,
  )
  const [reviewToolId, setReviewToolId] = useState<string | null>(null)

  const discoverCount = toolsSource.length
  const totalPocketCount = pocketToolIds.size

  const tools = useMemo<MarketToolCardItem[]>(
    () =>
      toolsSource.map((tool) => ({
        ...tool,
        reviewAggregate: reviewAggregates[tool.id] ?? null,
      })),
    [reviewAggregates, toolsSource],
  )

  const scopedTools = useMemo(
    () => resolveScopedTools({ scope: marketScope, tools, pocketToolIds }),
    [marketScope, pocketToolIds, tools],
  )

  const navigation = useMemo(
    () => buildMarketNavigation({ scopedTools, pocketToolIds, allTools: tools }),
    [pocketToolIds, scopedTools, tools],
  )
  const navigationEntries =
    marketScope === 'discover'
      ? ([
          [DISCOVER_HOME_SECTION_KEY, DISCOVER_HOME_SECTION_LABEL],
          ...navigation.categoryEntries,
        ] as const)
      : navigation.categoryEntries

  const resolvedSection = useMemo(
    () =>
      resolveMarketSection({
        selectedSection,
        categoryEntries: navigationEntries,
      }),
    [navigationEntries, selectedSection],
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
    setMarketScope(scope)
    if (scope === 'discover') {
      setSelectedSection(DISCOVER_HOME_SECTION_KEY)
    }
  }

  const selectSection = (key: MarketDiscoverSectionKey) => {
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
    readonly [Exclude<MarketDiscoverSectionKey, typeof DISCOVER_HOME_SECTION_KEY>, string]
  >
  return {
    query,
    setQuery: onQueryChange,
    submitOpen,
    setSubmitOpen,
    draft,
    setDraft,
    marketScope,
    setScope,
    selectedSection: resolvedSection,
    selectSection,
    navigationEntries,
    categoryEntries: discoverCategoryEntries,
    categoryCounts: navigation.categoryCounts,
    discoverCount,
    totalPocketCount,
    currentCategoryTools,
    reviewTool,
    reviewOpen: reviewTool != null,
    openReviewTool: setReviewToolId,
    closeReviewTool: () => setReviewToolId(null),
    submitDraft,
  }
}
