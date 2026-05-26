'use client'

import {
  MarketCategoryIcon,
  type MarketCategoryKey,
} from '@/components/market/market-category-icons'
import { MarketScopeSwitch } from '@/components/market/market-scope-switch'
import type { MarketScope } from '@/hooks/market-scope'
import { cn } from '@/lib/utils'

type DiscoverCategoryKey = Exclude<MarketCategoryKey, 'pocket'>

type MarketCategoryNavProps = {
  categoryEntries: ReadonlyArray<readonly [DiscoverCategoryKey, string]>
  categoryCounts: Record<DiscoverCategoryKey, number>
  selectedSection: DiscoverCategoryKey | 'pocket'
  marketScope: MarketScope
  discoverCount: number
  pocketCount: number
  onScopeChange: (scope: MarketScope) => void
  onSelect: (key: DiscoverCategoryKey) => void
}

export function MarketCategoryNav({
  categoryEntries,
  categoryCounts,
  selectedSection,
  marketScope,
  discoverCount,
  pocketCount,
  onScopeChange,
  onSelect,
}: MarketCategoryNavProps) {
  return (
    <>
      <aside
        className={cn(
          'hidden w-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm xl:flex xl:self-start',
        )}
      >
        <div className="shrink-0 border-b border-border/60 pb-3">
          <MarketScopeSwitch
            scope={marketScope}
            discoverCount={discoverCount}
            pocketCount={pocketCount}
            onScopeChange={onScopeChange}
          />
        </div>

        <div className="mt-3 space-y-1.5 pb-2">
          {categoryEntries.map(([key, label]) => {
            const count = categoryCounts[key]
            const active = selectedSection === key
            return (
              <button
                key={key}
                type="button"
                aria-label={label}
                title={label}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between rounded-xl border px-2 py-2 text-left transition-colors duration-200',
                  active
                    ? 'border-primary/20 bg-primary/[0.08] text-primary shadow-[0_12px_28px_rgba(37,99,235,0.10)]'
                    : 'border-border/50 bg-white/85 text-slate-700 hover:border-primary/15 hover:bg-white',
                )}
                onClick={() => onSelect(key)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      active ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    <MarketCategoryIcon category={key} />
                  </span>
                  <span
                    className={cn(
                      'truncate text-[13px] font-semibold leading-5',
                      active ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {label}
                  </span>
                </span>

                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                    active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      <div className="space-y-2 xl:hidden">
        <MarketScopeSwitch
          scope={marketScope}
          discoverCount={discoverCount}
          pocketCount={pocketCount}
          onScopeChange={onScopeChange}
        />
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white/95 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white/95 to-transparent" />
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryEntries.map(([key, label]) => {
              const active = selectedSection === key
              return (
                <button
                  key={key}
                  type="button"
                  className={cn(
                    'inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold shadow-sm transition-colors duration-200',
                    active
                      ? 'border-primary/15 bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(37,99,235,0.22)]'
                      : 'border-white/80 bg-white/88 text-foreground/85 hover:border-primary/10 hover:bg-white',
                  )}
                  onClick={() => onSelect(key)}
                >
                  <MarketCategoryIcon category={key} className="h-3.5 w-3.5" />
                  <span>{label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
                      active
                        ? 'bg-primary-foreground/15 text-primary-foreground'
                        : 'bg-slate-100 text-muted-foreground',
                    )}
                  >
                    {categoryCounts[key]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
