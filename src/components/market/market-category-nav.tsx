'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  MarketCategoryIcon,
  type MarketCategoryKey,
} from '@/components/market/market-category-icons'
import { cn } from '@/lib/utils'

type MarketCategoryNavProps = {
  categoryEntries: ReadonlyArray<readonly [MarketCategoryKey, string]>
  categoryCounts: Record<MarketCategoryKey, number>
  sidebarCollapsed: boolean
  selectedSection: MarketCategoryKey
  onSelect: (key: MarketCategoryKey) => void
  onToggleCollapsed: () => void
}

export function MarketCategoryNav({
  categoryEntries,
  categoryCounts,
  sidebarCollapsed,
  selectedSection,
  onSelect,
  onToggleCollapsed,
}: MarketCategoryNavProps) {
  return (
    <>
      <aside
        className={cn(
          'hidden h-full overflow-hidden rounded-[2rem] p-2.5 bg-white xl:block',
          sidebarCollapsed ? 'px-2' : 'px-2.5',
        )}
      >
        <div
          className={cn(
            'flex items-center border-slate-200/80 bg-white px-2 py-2',
            sidebarCollapsed ? 'justify-center' : 'justify-between',
          )}
        >
          {!sidebarCollapsed ? (
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              市场导航
            </p>
          ) : null}
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
            onClick={onToggleCollapsed}
            aria-label={sidebarCollapsed ? '展开市场侧边栏' : '收起市场侧边栏'}
            title={sidebarCollapsed ? '展开市场侧边栏' : '收起市场侧边栏'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-1.5 space-y-1">
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
                  'relative flex w-full items-center rounded-2xl border text-left shadow-sm transition-all duration-200',
                  active
                    ? 'border-primary/20 bg-primary/[0.08] text-primary shadow-[0_12px_28px_rgba(37,99,235,0.10)]'
                    : 'border-slate-200/80 bg-white text-slate-700 hover:border-primary/15 hover:bg-slate-50',
                  sidebarCollapsed ? 'justify-center px-1.5 py-1.5' : 'justify-between px-2 py-2',
                )}
                onClick={() => onSelect(key)}
              >
                <span
                  className={cn(
                    'flex min-w-0 items-center gap-2',
                    sidebarCollapsed ? 'justify-center' : '',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      active ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600',
                    )}
                  >
                    <MarketCategoryIcon category={key} />
                  </span>
                  {!sidebarCollapsed ? (
                    <span
                      className={cn(
                        'truncate text-[13px] font-semibold leading-5',
                        active ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {label}
                    </span>
                  ) : null}
                </span>

                {!sidebarCollapsed ? (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                      active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-muted-foreground',
                    )}
                  >
                    {count}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'absolute right-0.5 top-0.5 rounded-full px-1 py-0.5 text-[8px] font-semibold',
                      active ? 'bg-primary text-primary-foreground' : 'bg-slate-200 text-slate-600',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </aside>

      <div className="relative xl:hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white/95 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white/95 to-transparent" />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoryEntries.map(([key, label]) => {
            const active = selectedSection === key
            return (
              <button
                key={key}
                type="button"
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold shadow-sm transition-all duration-200',
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
    </>
  )
}
