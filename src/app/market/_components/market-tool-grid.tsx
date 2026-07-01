'use client'

import { MarketToolCard } from '@/app/market/_components/market-tool-card'
import { MarketUnavailableToolCard } from '@/app/market/_components/market-unavailable-tool-card'
import type { MarketToolCardItem } from '@/shared/market-scope'

type MarketToolGridProps = {
  tools: MarketToolCardItem[]
  savedToolIds: Set<string>
  unavailableToolIds?: string[]
  onSaveTool: (toolId: string) => void
  onRemoveTool: (toolId: string) => void
  onOpenTool: (toolId: string, url?: string | null) => void
  onReviewTool: (toolId: string) => void
}

export function MarketToolGrid({
  tools,
  savedToolIds,
  unavailableToolIds = [],
  onSaveTool,
  onRemoveTool,
  onOpenTool,
  onReviewTool,
}: MarketToolGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
        <MarketToolCard
          key={tool.id}
          tool={tool}
          isSaved={savedToolIds.has(tool.id)}
          onSaveTool={onSaveTool}
          onRemoveTool={onRemoveTool}
          onOpenTool={onOpenTool}
          onReviewTool={onReviewTool}
        />
      ))}
      {unavailableToolIds.map((toolId) => (
        <MarketUnavailableToolCard key={toolId} toolId={toolId} onRemove={onRemoveTool} />
      ))}
    </div>
  )
}
