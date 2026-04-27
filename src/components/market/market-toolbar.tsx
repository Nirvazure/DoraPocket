'use client'

import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PAGE_COPY } from '@/shared/ui-copy'

type MarketToolbarProps = {
  query: string
  onQueryChange: (value: string) => void
  onOpenSubmit: () => void
}

export function MarketToolbar({ query, onQueryChange, onOpenSubmit }: MarketToolbarProps) {
  return (
    <section className="px-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={PAGE_COPY.market.searchPlaceholder}
            className="h-10 w-full rounded-full border border-border/70 bg-background pl-11 pr-4 text-sm outline-none ring-primary/30 placeholder:text-muted-foreground focus-visible:ring-2"
          />
        </div>
        <Button
          type="button"
          size="sm"
          className="h-10 rounded-full px-3 text-xs font-bold"
          onClick={onOpenSubmit}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {PAGE_COPY.market.submitAction}
        </Button>
      </div>
    </section>
  )
}
