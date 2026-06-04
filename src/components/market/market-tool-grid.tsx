'use client'

import { ExternalLink, FolderHeart, PenLine, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketToolIcon } from '@/components/market/market-tool-icon'
import { MarketToolTags } from '@/components/market/market-tool-tags'
import type { MarketToolCardItem } from '@/shared/market-scope'
import { MarketUnavailableToolCard } from '@/components/market/market-unavailable-tool-card'
import { MARKET_ACTIVITY_COPY, PAGE_COPY } from '@/shared/ui-copy'

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
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => {
        const isSaved = savedToolIds.has(tool.id)

        return (
          <article
            key={tool.id}
            className="group relative flex min-h-40 flex-col rounded-[1.5rem] border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:bg-white hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
          >
            <div className="absolute right-3 top-3 z-10 flex max-w-[42%] flex-col items-end gap-1">
              {tool.reviewAggregate?.averageStar != null ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto min-h-0 gap-1 rounded-full border border-border/60 bg-white/90 px-2 py-1 text-[10px] font-semibold text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/15 hover:bg-white hover:text-foreground [&_svg]:size-3"
                  onClick={() => onReviewTool(tool.id)}
                >
                  <Star className="fill-amber-400 text-amber-400" />
                  <span className="text-foreground">
                    {tool.reviewAggregate.averageStar.toFixed(1)}
                  </span>
                  <span>
                    · {tool.reviewAggregate.reviewCount}
                    {PAGE_COPY.market.reviewCountLabel}
                  </span>
                  {tool.reviewAggregate.currentUserReview ? (
                    <PenLine className="text-muted-foreground" />
                  ) : null}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto min-h-0 gap-1 rounded-full border border-border/60 bg-white/90 px-2 py-1 text-[10px] font-semibold text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/15 hover:bg-white hover:text-foreground [&_svg]:size-3"
                  onClick={() => onReviewTool(tool.id)}
                >
                  <Star />
                  {PAGE_COPY.market.reviewSupplementScore}
                </Button>
              )}
              {tool.reviewAggregate?.topTags.length ? (
                <div className="flex flex-wrap justify-end gap-1">
                  {tool.reviewAggregate.topTags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary/[0.08] px-2 py-0.5 text-[9px] font-bold text-primary"
                    >
                      {MARKET_ACTIVITY_COPY.reviewTags[tag]}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-start gap-2.5 pr-24">
              <MarketToolIcon tool={tool} />
              <div className="min-w-0 flex-1">
                <p className="text-base font-black leading-6 text-foreground">{tool.name}</p>
                <MarketToolTags tags={tool.tags} />
                <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 pt-3">
              {isSaved ? (
                <Button
                  type="button"
                  variant="default"
                  size="icon-sm"
                  className="rounded-full shadow-none"
                  aria-label={PAGE_COPY.market.removeFromPocketAction}
                  title={PAGE_COPY.market.removeFromPocketAction}
                  onClick={() => onRemoveTool(tool.id)}
                >
                  <FolderHeart className="h-3.5 w-3.5 fill-primary-foreground/30" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="rounded-full border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-500"
                  aria-label={PAGE_COPY.market.collectAction}
                  title={PAGE_COPY.market.collectAction}
                  onClick={() => onSaveTool(tool.id)}
                >
                  <FolderHeart className="h-3.5 w-3.5" />
                </Button>
              )}
              {tool.url ? (
                <Button
                  type="button"
                  className="h-7 rounded-full px-2 text-[10px]"
                  onClick={() => onOpenTool(tool.id, tool.url)}
                >
                  {PAGE_COPY.market.openAction}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              ) : (
                <span aria-hidden="true" className="h-7 w-7 shrink-0" />
              )}
            </div>
          </article>
        )
      })}
      {unavailableToolIds.map((toolId) => (
        <MarketUnavailableToolCard key={toolId} toolId={toolId} onRemove={onRemoveTool} />
      ))}
    </div>
  )
}
