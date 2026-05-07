'use client'

import { ExternalLink, FolderOpenDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketToolIcon } from '@/components/market/market-tool-icon'
import { cn } from '@/lib/utils'
import type { MarketToolCardItem } from '@/hooks/use-market-page-model'
import { MARKET_ACTIVITY_COPY } from '@/shared/ui-copy'
import { TOOL_SOURCE_LABELS } from '@/shared/tool-labels'
import { PAGE_COPY } from '@/shared/ui-copy'

type MarketToolGridProps = {
  tools: MarketToolCardItem[]
  onSaveTool: (toolId: string) => void
  onOpenTool: (toolId: string) => void
  onReviewTool: (toolId: string) => void
}

function sourceLabelFor(tool: MarketToolCardItem): string {
  if (tool.source === 'builtin') return '系统工具'
  if (tool.marketAssetOrigin === 'community' || tool.source === 'submitted') return '用户提交'
  return TOOL_SOURCE_LABELS[tool.source]
}

export function MarketToolGrid({
  tools,
  onSaveTool,
  onOpenTool,
  onReviewTool,
}: MarketToolGridProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
        <article
          key={tool.id}
          className="group flex min-h-40 flex-col rounded-[1.5rem] border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:bg-white hover:shadow-[0_14px_34px_rgba(15,23,42,0.08)]"
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex min-w-0 items-start gap-2.5">
              <MarketToolIcon tool={tool} />
              <div className="min-w-0">
                <p className="text-base font-black leading-6 text-foreground">{tool.name}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-1 text-[9px] font-bold',
                tool.source === 'builtin'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-white text-muted-foreground',
              )}
            >
              {sourceLabelFor(tool)}
            </span>
          </div>
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
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div className="flex-1">
              <p className="line-clamp-2 text-[10px] font-semibold leading-4 text-muted-foreground">
                {tool.reviewAggregate?.averageStar != null
                  ? `${tool.reviewAggregate.averageStar.toFixed(1)} 分 · ${tool.reviewAggregate.reviewCount}${PAGE_COPY.market.reviewCountLabel}`
                  : PAGE_COPY.market.reviewEmptyLabel}{' '}
                {PAGE_COPY.market.stats.opens} {tool.usageStats.opens} ·{' '}
                {tool.executionMode === 'native_card'
                  ? PAGE_COPY.market.stats.nativeCard
                  : PAGE_COPY.market.stats.externalLink}
              </p>
              {tool.reviewAggregate?.topTags.length ? (
                <div className="mt-1 flex flex-wrap gap-1">
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
            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                className="h-7 rounded-full px-2 text-[10px] text-muted-foreground hover:bg-slate-100 hover:text-foreground"
                onClick={() => onReviewTool(tool.id)}
              >
                {tool.reviewAggregate?.currentUserReview
                  ? PAGE_COPY.market.updateReviewAction
                  : PAGE_COPY.market.reviewAction}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-7 rounded-full bg-white px-2 text-[10px]"
                onClick={() => onSaveTool(tool.id)}
              >
                <FolderOpenDot className="mr-1 h-3 w-3" />
                {PAGE_COPY.market.collectAction}
              </Button>
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
      ))}
    </div>
  )
}
