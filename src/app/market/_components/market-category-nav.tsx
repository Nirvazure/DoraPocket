'use client'

import {
  MarketCategoryIcon,
  type MarketCategoryKey,
} from '@/app/market/_components/market-category-icons'
import { MarketScopeSwitch } from '@/app/market/_components/market-scope-switch'
import type { MarketScope } from '@/shared/market/market-scope'
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

type CategoryRowProps = {
  categoryKey: DiscoverCategoryKey
  label: string
  count: number
  active: boolean
  onSelect: (key: DiscoverCategoryKey) => void
}

function MarketCategoryRow({ categoryKey, label, count, active, onSelect }: CategoryRowProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'true' : undefined}
      title={label}
      className={cn('dp-market-nav-item', active && 'dp-market-nav-item-active')}
      onClick={() => onSelect(categoryKey)}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className={cn('dp-market-nav-icon', active && 'dp-market-nav-icon-active')}>
          <MarketCategoryIcon category={categoryKey} className="size-4" />
        </span>
        <span
          className={cn(
            'truncate text-[13px] font-semibold leading-5 text-slate-800',
            active && 'dp-market-nav-label-active',
          )}
        >
          {label}
        </span>
      </span>
      <span className={cn('dp-market-nav-count', active && 'dp-market-nav-count-active')}>
        {count}
      </span>
    </button>
  )
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
      <aside className="dp-market-sidebar hidden xl:flex xl:self-start">
        <div className="dp-market-sidebar-header">
          <MarketScopeSwitch
            scope={marketScope}
            discoverCount={discoverCount}
            pocketCount={pocketCount}
            onScopeChange={onScopeChange}
          />
        </div>

        <nav className="dp-market-sidebar-list" aria-label="道具分类">
          {categoryEntries.map(([key, label]) => (
            <MarketCategoryRow
              key={key}
              categoryKey={key}
              label={label}
              count={categoryCounts[key]}
              active={selectedSection === key}
              onSelect={onSelect}
            />
          ))}
        </nav>
      </aside>

      <div className="space-y-2.5 xl:hidden">
        <MarketScopeSwitch
          scope={marketScope}
          discoverCount={discoverCount}
          pocketCount={pocketCount}
          onScopeChange={onScopeChange}
        />
        <div className="relative">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#edf4ff] to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#edf4ff] to-transparent"
            aria-hidden
          />
          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="navigation"
            aria-label="道具分类"
          >
            {categoryEntries.map(([key, label]) => {
              const active = selectedSection === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  className={cn('dp-market-chip', active && 'dp-market-chip-active')}
                  onClick={() => onSelect(key)}
                >
                  <span
                    className={cn(
                      'flex size-7 items-center justify-center rounded-full',
                      active
                        ? 'bg-primary-foreground/15 text-primary-foreground'
                        : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    <MarketCategoryIcon category={key} className="size-3.5" />
                  </span>
                  <span>{label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
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
