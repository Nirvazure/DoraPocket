'use client'

import { ArrowRight, ExternalLink, FolderHeart, Sparkles, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketToolIcon } from '@/components/shared/market-tool-icon'
import type { MarketReviewAggregate } from '@/shared/market/market-types'
import type { MarketToolCardItem } from '@/shared/market/market-scope'
import { PAGE_COPY } from '@/shared/copy/ui-copy'
import { cn } from '@/lib/utils'

type MarketCuratedHomeProps = {
  featuredTools: MarketToolCardItem[]
  savedToolIds: Set<string>
  onSaveTool: (toolId: string) => void
  onRemoveTool: (toolId: string) => void
  onOpenTool: (toolId: string, url?: string | null) => void
  onReviewTool: (toolId: string) => void
}

function getReviewSignal(tool: MarketToolCardItem) {
  const aggregate = tool.reviewAggregate as MarketReviewAggregate | null
  const rating = aggregate?.averageStar ?? tool.ratingSummary.score ?? 0
  const reviewCount = aggregate?.reviewCount ?? 0
  const saveCount = tool.usageStats.saves ?? 0
  return rating * 24 + reviewCount * 4 + saveCount * 0.5
}

function MarketFeaturedCard({
  tool,
  onSaveTool,
  onRemoveTool,
  onOpenTool,
  onReviewTool,
  isSaved,
}: {
  tool: MarketToolCardItem
  onSaveTool: (toolId: string) => void
  onRemoveTool: (toolId: string) => void
  onOpenTool: (toolId: string, url?: string | null) => void
  onReviewTool: (toolId: string) => void
  isSaved: boolean
}) {
  const aggregate = tool.reviewAggregate as MarketReviewAggregate | null

  return (
    <article className="dp-market-featured-card relative overflow-hidden">
      <div className="relative z-[1] flex h-full flex-col gap-4">
        <div className="flex items-start gap-4">
          <MarketToolIcon tool={tool} size="hero" />
          <div className="min-w-0 flex-1">
            <p className="dp-market-featured-kicker">本周主推</p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-[28px] font-black tracking-tight text-slate-950">
                  {tool.name}
                </h3>
                <p className="mt-2 line-clamp-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {tool.description}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="dp-tool-chip h-auto gap-1 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                onClick={() => onReviewTool(tool.id)}
              >
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {aggregate?.averageStar != null
                  ? aggregate.averageStar.toFixed(1)
                  : PAGE_COPY.market.reviewSupplementScore}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="dp-market-metric-pill">
            <span className="dp-market-metric-label">收藏</span>
            <span className="dp-market-metric-value">{tool.usageStats.saves}</span>
          </div>
          <div className="dp-market-metric-pill">
            <span className="dp-market-metric-label">标签</span>
            <span className="dp-market-metric-value">{tool.tags.length}</span>
          </div>
          <div className="dp-market-metric-pill">
            <span className="dp-market-metric-label">评分</span>
            <span className="dp-market-metric-value">
              {aggregate?.averageStar != null ? aggregate.averageStar.toFixed(1) : '待补充'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tool.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="dp-tool-chip px-2.5 py-1 text-[10px] font-bold text-primary">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            className={cn(
              'dp-market-featured-action',
              isSaved && 'dp-market-featured-action-active',
            )}
            onClick={() => (isSaved ? onRemoveTool(tool.id) : onSaveTool(tool.id))}
          >
            <Sparkles className="size-3.5" />
            {isSaved ? PAGE_COPY.market.removeFromPocketAction : PAGE_COPY.market.collectAction}
          </button>
          {tool.url ? (
            <Button
              type="button"
              className="dp-tool-cta h-10 rounded-full px-4 text-xs font-bold"
              onClick={() => onOpenTool(tool.id, tool.url)}
            >
              {PAGE_COPY.market.openAction}
              <ArrowRight className="ml-1 size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function MarketMiniFeatureCard({
  tool,
  onSaveTool,
  onRemoveTool,
  onOpenTool,
  isSaved,
}: {
  tool: MarketToolCardItem
  onSaveTool: (toolId: string) => void
  onRemoveTool: (toolId: string) => void
  onOpenTool: (toolId: string, url?: string | null) => void
  isSaved: boolean
}) {
  return (
    <article className="dp-market-mini-card">
      <div className="flex items-start gap-3">
        <MarketToolIcon tool={tool} size="card" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-black tracking-tight text-slate-900">
            {tool.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{tool.description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className={cn('dp-market-mini-save', isSaved && 'dp-market-mini-save-active')}
          onClick={() => (isSaved ? onRemoveTool(tool.id) : onSaveTool(tool.id))}
          aria-label={
            isSaved ? PAGE_COPY.market.removeFromPocketAction : PAGE_COPY.market.collectAction
          }
        >
          <FolderHeart className="size-3.5" />
        </button>
        {tool.url ? (
          <Button
            type="button"
            className="dp-tool-cta h-8 rounded-full px-3 text-[11px] font-bold"
            onClick={() => onOpenTool(tool.id, tool.url)}
          >
            {PAGE_COPY.market.openAction}
            <ExternalLink className="ml-1 size-3" />
          </Button>
        ) : (
          <span className="h-8 w-8 shrink-0" aria-hidden="true" />
        )}
      </div>
    </article>
  )
}

export function MarketCuratedHome({
  featuredTools,
  savedToolIds,
  onSaveTool,
  onRemoveTool,
  onOpenTool,
  onReviewTool,
}: MarketCuratedHomeProps) {
  const curatedFeaturedTools = [...featuredTools]
    .sort((a, b) => getReviewSignal(b) - getReviewSignal(a))
    .slice(0, 5)
  const spotlight = curatedFeaturedTools[0]
  const supportingTools = curatedFeaturedTools.slice(1, 5)

  return (
    <section>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        {spotlight ? (
          <MarketFeaturedCard
            tool={spotlight}
            isSaved={savedToolIds.has(spotlight.id)}
            onSaveTool={onSaveTool}
            onRemoveTool={onRemoveTool}
            onOpenTool={onOpenTool}
            onReviewTool={onReviewTool}
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          {supportingTools.map((tool) => (
            <MarketMiniFeatureCard
              key={tool.id}
              tool={tool}
              isSaved={savedToolIds.has(tool.id)}
              onSaveTool={onSaveTool}
              onRemoveTool={onRemoveTool}
              onOpenTool={onOpenTool}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
