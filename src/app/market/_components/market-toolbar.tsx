'use client'

import type { ReactNode } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PAGE_COPY } from '@/shared/copy/ui-copy'
import { cn } from '@/lib/utils'

type MarketToolbarProps = {
  query: string
  onQueryChange: (value: string) => void
  onOpenSubmit: () => void
  rightSlot?: ReactNode
}

export function MarketToolbar({
  query,
  onQueryChange,
  onOpenSubmit,
  rightSlot,
}: MarketToolbarProps) {
  const hasQuery = query.trim().length > 0

  return (
    <section className="px-1">
      <div className="dp-market-toolbar-shell">
        <div className="dp-market-search-shell max-w-[28rem]">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={PAGE_COPY.market.searchPlaceholder}
            aria-label={PAGE_COPY.market.searchPlaceholder}
            className="h-11 w-full rounded-full border border-white/85 bg-white/90 pl-11 pr-24 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_10px_26px_-18px_rgba(15,23,42,0.28)] outline-none transition-[box-shadow,border-color] placeholder:text-slate-400 focus-visible:border-primary/25 focus-visible:ring-2 focus-visible:ring-primary/25"
          />
          {hasQuery ? (
            <button
              type="button"
              aria-label="清空搜索"
              className={cn(
                'absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-sm transition hover:border-primary/20 hover:text-primary',
              )}
              onClick={() => onQueryChange('')}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {rightSlot}
          <Button
            type="button"
            size="sm"
            className="h-11 shrink-0 rounded-full px-4 text-xs font-bold"
            onClick={onOpenSubmit}
          >
            <Plus className="mr-1.5 size-3.5" />
            {PAGE_COPY.market.submitAction}
          </Button>
        </div>
      </div>
    </section>
  )
}
