'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  MarketCategoryIcon,
  type MarketCategoryKey,
} from '@/app/market/_components/market-category-icons'
import { cn } from '@/lib/utils'
import {
  DISCOVER_HOME_SECTION_KEY,
  type MarketDiscoverSectionKey,
} from '@/shared/market/market-scope'

type DiscoverCategoryKey = Exclude<MarketCategoryKey, 'discover_home' | 'pocket'>

type MarketCategoryNavProps = {
  navigationEntries: ReadonlyArray<readonly [MarketDiscoverSectionKey, string]>
  categoryCounts: Record<DiscoverCategoryKey, number>
  selectedSection: MarketDiscoverSectionKey | 'pocket'
  collapsed: boolean
  onToggleCollapsed: () => void
  onSelect: (key: MarketDiscoverSectionKey) => void
}

function SectionButton({
  categoryKey,
  label,
  count,
  active,
  featured = false,
  collapsed,
  showCollapseToggle = false,
  onToggleCollapsed,
  onSelect,
}: {
  categoryKey: MarketDiscoverSectionKey
  label: string
  count: number | null
  active: boolean
  featured?: boolean
  collapsed: boolean
  showCollapseToggle?: boolean
  onToggleCollapsed?: () => void
  onSelect: (key: MarketDiscoverSectionKey) => void
}) {
  const content = (
    <>
      <span
        className={cn(
          collapsed ? 'dp-market-sidebar-icon-wrap-collapsed' : 'dp-market-sidebar-icon-wrap',
          featured && !collapsed && 'dp-market-sidebar-home-icon',
        )}
      >
        <MarketCategoryIcon category={categoryKey} className="size-4" />
      </span>

      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[13px] font-bold text-slate-900">{label}</span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">
              {featured ? '精选入口' : count != null ? `${count} 个工具` : '浏览入口'}
            </span>
          </span>
          {count != null && !showCollapseToggle ? (
            <span
              className={cn('dp-market-sidebar-pill', active && 'dp-market-sidebar-pill-active')}
            >
              {count}
            </span>
          ) : null}
        </>
      ) : null}
    </>
  )

  const sectionButton = (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? 'true' : undefined}
      title={label}
      className={cn(
        collapsed ? 'dp-market-sidebar-icon-btn' : 'dp-market-sidebar-section-btn',
        featured && !collapsed && 'dp-market-sidebar-home-btn',
        active && 'dp-market-sidebar-btn-active',
      )}
      onClick={() => onSelect(categoryKey)}
    >
      {content}
    </button>
  )

  if (showCollapseToggle && !collapsed && onToggleCollapsed) {
    return (
      <div className="dp-market-sidebar-home-header">
        <button
          type="button"
          aria-label={label}
          aria-current={active ? 'true' : undefined}
          title={label}
          className={cn(
            'dp-market-sidebar-home-main-card',
            active && 'dp-market-sidebar-btn-active',
          )}
          onClick={() => onSelect(categoryKey)}
        >
          {content}
        </button>
        <button
          type="button"
          aria-label="收起侧栏"
          className="dp-market-sidebar-home-toggle"
          onClick={onToggleCollapsed}
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>
    )
  }

  return sectionButton
}

export function MarketCategoryNav({
  navigationEntries,
  categoryCounts,
  selectedSection,
  collapsed,
  onToggleCollapsed,
  onSelect,
}: MarketCategoryNavProps) {
  const homeEntry = navigationEntries.find(([key]) => key === DISCOVER_HOME_SECTION_KEY) ?? null
  const categoryEntries = navigationEntries.filter(
    (entry): entry is readonly [DiscoverCategoryKey, string] =>
      entry[0] !== DISCOVER_HOME_SECTION_KEY,
  )

  return (
    <>
      <aside
        className={cn(
          'dp-market-sidebar hidden xl:flex xl:self-start',
          collapsed && 'dp-market-sidebar-collapsed',
        )}
      >
        <div className="dp-market-sidebar-scroll">
          {homeEntry ? (
            <SectionButton
              categoryKey={homeEntry[0]}
              label={homeEntry[1]}
              count={null}
              active={selectedSection === homeEntry[0]}
              featured
              collapsed={collapsed}
              showCollapseToggle={!collapsed}
              onToggleCollapsed={onToggleCollapsed}
              onSelect={onSelect}
            />
          ) : null}

          {collapsed ? (
            <button
              type="button"
              aria-label="展开侧栏"
              className="dp-market-sidebar-icon-btn dp-market-sidebar-rail-control"
              onClick={onToggleCollapsed}
            >
              <ChevronRight className="size-4" />
            </button>
          ) : null}

          {!collapsed ? <div className="dp-market-sidebar-divider" aria-hidden /> : null}

          <div className={cn('mt-3 flex flex-col gap-2', collapsed && 'mt-2')}>
            {categoryEntries.map(([key, label]) => (
              <SectionButton
                key={key}
                categoryKey={key}
                label={label}
                count={categoryCounts[key]}
                active={selectedSection === key}
                collapsed={collapsed}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </aside>

      <div className="space-y-2.5 xl:hidden">
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
            aria-label="工具分类"
          >
            {navigationEntries.map(([key, label]) => {
              const active = selectedSection === key
              const count = key === DISCOVER_HOME_SECTION_KEY ? null : categoryCounts[key]

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
                  {count != null ? (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                        active
                          ? 'bg-primary-foreground/15 text-primary-foreground'
                          : 'bg-slate-100 text-muted-foreground',
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
