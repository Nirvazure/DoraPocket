'use client'

import { ExternalLink, FolderHeart, PenLine, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketToolIcon } from '@/components/shared/market-tool-icon'
import { MarketToolTags } from '@/app/market/_components/market-tool-tags'
import type { MarketToolCardItem } from '@/shared/market/market-scope'
import { MARKET_ACTIVITY_COPY, PAGE_COPY } from '@/shared/copy/ui-copy'
import { cn } from '@/lib/utils'

type MarketToolCardProps = {
  tool: MarketToolCardItem
  isSaved: boolean
  onSaveTool: (toolId: string) => void
  onRemoveTool: (toolId: string) => void
  onOpenTool: (toolId: string, url?: string | null) => void
  onReviewTool: (toolId: string) => void
}

export function MarketToolCard({
  tool,
  isSaved,
  onSaveTool,
  onRemoveTool,
  onOpenTool,
  onReviewTool,
}: MarketToolCardProps) {
  const hasRating = tool.reviewAggregate?.averageStar != null

  return (
    <article className="dp-tool-card group relative flex min-h-[11.5rem] flex-col">
      <header className="relative z-[1] flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <MarketToolIcon tool={tool} size="card" />
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="truncate text-[15px] font-black tracking-tight text-slate-900">
              {tool.name}
            </h3>
            <MarketToolTags tags={tool.tags} className="mt-1" />
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <Button
            type="button"
            variant="ghost"
            className={cn(
              'dp-tool-chip h-auto min-h-0 cursor-pointer gap-1 px-2.5 py-1 text-[10px] font-semibold',
              hasRating ? 'text-slate-600' : 'text-slate-500',
            )}
            onClick={() => onReviewTool(tool.id)}
          >
            <Star
              className={cn(
                'size-3',
                hasRating ? 'fill-amber-400 text-amber-400' : 'text-slate-400',
              )}
            />
            {hasRating && tool.reviewAggregate ? (
              <>
                <span className="text-slate-900">
                  {tool.reviewAggregate.averageStar?.toFixed(1)}
                </span>
                <span className="text-slate-500">
                  · {tool.reviewAggregate.reviewCount}
                  {PAGE_COPY.market.reviewCountLabel}
                </span>
                {tool.reviewAggregate.currentUserReview ? (
                  <PenLine className="text-slate-400" />
                ) : null}
              </>
            ) : (
              PAGE_COPY.market.reviewSupplementScore
            )}
          </Button>
          {tool.reviewAggregate?.topTags.length ? (
            <div className="flex max-w-[9rem] flex-wrap justify-end gap-1">
              {tool.reviewAggregate.topTags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="dp-tool-chip px-2 py-0.5 text-[9px] font-bold text-primary"
                >
                  {MARKET_ACTIVITY_COPY.reviewTags[tag]}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <p className="relative z-[1] mt-3 line-clamp-2 text-xs leading-5 text-slate-600">
        {tool.description}
      </p>

      <footer className="dp-tool-card-footer relative z-[1] mt-auto flex items-center justify-between gap-2 pt-3">
        {isSaved ? (
          <Button
            type="button"
            variant="default"
            size="icon-sm"
            className="dp-tool-pocket-btn cursor-pointer rounded-full shadow-none"
            aria-label={PAGE_COPY.market.removeFromPocketAction}
            title={PAGE_COPY.market.removeFromPocketAction}
            onClick={() => onRemoveTool(tool.id)}
          >
            <FolderHeart className="size-3.5 fill-primary-foreground/30" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="dp-tool-pocket-btn dp-tool-pocket-btn-outline cursor-pointer rounded-full"
            aria-label={PAGE_COPY.market.collectAction}
            title={PAGE_COPY.market.collectAction}
            onClick={() => onSaveTool(tool.id)}
          >
            <FolderHeart className="size-3.5" />
          </Button>
        )}
        {tool.url ? (
          <Button
            type="button"
            className="dp-tool-cta h-8 cursor-pointer rounded-full px-3.5 text-[11px] font-bold"
            onClick={() => onOpenTool(tool.id, tool.url)}
          >
            {PAGE_COPY.market.openAction}
            <ExternalLink className="ml-1 size-3" />
          </Button>
        ) : (
          <span aria-hidden="true" className="h-8 w-8 shrink-0" />
        )}
      </footer>
    </article>
  )
}
