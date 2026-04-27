'use client'

import { cn } from '@/lib/utils'
import type { ToolCategory } from '@/services/tool-registry'

type CategoryKey = 'builtin' | ToolCategory

type MarketCategoryNavProps = {
  categoryEntries: ReadonlyArray<readonly [CategoryKey, string]>
  categoryCounts: Record<CategoryKey, number>
  selectedSection: CategoryKey
  onSelect: (key: CategoryKey) => void
}

export function MarketCategoryNav({
  categoryEntries,
  categoryCounts,
  selectedSection,
  onSelect,
}: MarketCategoryNavProps) {
  return (
    <>
      <aside className="hidden h-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/92 p-4 shadow-xl shadow-slate-900/8 backdrop-blur-xl xl:block">
        <div className="rounded-[1.6rem] border border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,247,255,0.96))] p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Market Directory</p>
          <h2 className="mt-2 text-lg font-black text-foreground">市场导航</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">从左侧切分类，右侧只负责展示当前展区的卡片结果。</p>
        </div>

        <div className="mt-4 space-y-2">
          {categoryEntries.map(([key, label]) => {
            const count = categoryCounts[key]
            const active = selectedSection === key
            return (
              <button
                key={key}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left shadow-sm transition-all duration-200',
                  active
                    ? 'border-primary/15 bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(37,99,235,0.18)]'
                    : 'border-border/60 bg-slate-50/95 hover:-translate-y-0.5 hover:border-primary/10 hover:bg-white',
                )}
                onClick={() => onSelect(key)}
              >
                <span className={cn('text-sm font-bold', active ? 'text-primary-foreground' : 'text-foreground')}>{label}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    active ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-white text-muted-foreground',
                  )}
                >
                  {count}
                </span>
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
                <span>{label}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
                    active ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-slate-100 text-muted-foreground',
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
