'use client'

import { ExternalLink, FolderOpenDot, HeartOff, PenLine, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketToolIcon } from '@/components/market/market-tool-icon'
import type { MarketToolCardItem } from '@/hooks/market-scope'
import { MARKET_ACTIVITY_COPY, PAGE_COPY } from '@/shared/ui-copy'

type MarketToolGridProps = {
  tools: MarketToolCardItem[]
  savedToolIds: Set<string>
  onSaveTool: (toolId: string) => void
  onRemoveTool: (toolId: string) => void
  onOpenTool: (toolId: string) => void
  onReviewTool: (toolId: string) => void
}

export function MarketToolGrid({
  tools,
  savedToolIds,
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
            className="group flex min-h-40 flex-col rounded-[1.5rem] border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:bg-white hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start gap-2.5">
              <MarketToolIcon tool={tool} />
              <div className="min-w-0 flex-1">
                <p className="text-base font-black leading-6 text-foreground">{tool.name}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            </div>
            {tool.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tool.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/80 bg-white px-2 py-0.5 text-[9px] font-semibold text-foreground/70 transition-colors group-hover:border-primary/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            <div className="mt-auto flex items-end justify-between gap-2 pt-3">
              <div className="min-w-0 flex-1 space-y-1">
                {tool.reviewAggregate?.averageStar != null ? (
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[10px] font-semibold leading-4 text-muted-foreground">
                      {tool.reviewAggregate.averageStar.toFixed(1)} 分 ·{' '}
                      {tool.reviewAggregate.reviewCount}
                      {PAGE_COPY.market.reviewCountLabel}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto min-h-0 gap-1 rounded-md px-0 py-0 text-[10px] font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground hover:underline [&_svg]:size-3"
                      onClick={() => onReviewTool(tool.id)}
                    >
                      {tool.reviewAggregate.currentUserReview ? (
                        <>
                          <PenLine />
                          {PAGE_COPY.market.updateReviewAction}
                        </>
                      ) : (
                        <>
                          <Star />
                          {PAGE_COPY.market.reviewAction}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto min-h-0 gap-1 rounded-md px-0 py-0 text-[10px] font-semibold text-muted-foreground hover:bg-transparent hover:text-foreground hover:underline [&_svg]:size-3"
                    onClick={() => onReviewTool(tool.id)}
                  >
                    <Star />
                    {PAGE_COPY.market.reviewSupplementScore}
                  </Button>
                )}
                {tool.reviewAggregate?.topTags.length ? (
                  <div className="flex flex-wrap gap-1">
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
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                {isSaved ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-7 rounded-full bg-white px-2 text-[10px]"
                    onClick={() => onRemoveTool(tool.id)}
                  >
                    <HeartOff className="mr-1 h-3 w-3" />
                    {PAGE_COPY.market.removeFromPocketAction}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-7 rounded-full px-2 text-[10px]"
                    onClick={() => onSaveTool(tool.id)}
                  >
                    <FolderOpenDot className="mr-1 h-3 w-3" />
                    {PAGE_COPY.market.collectAction}
                  </Button>
                )}
                {tool.url ? (
                  <Button
                    type="button"
                    className="h-7 rounded-full px-2 text-[10px]"
                    onClick={() => onOpenTool(tool.id)}
                  >
                    {PAGE_COPY.market.openAction}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                ) : null}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
