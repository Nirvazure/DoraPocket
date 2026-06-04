'use client'

import type { MarketScope } from '@/shared/market-scope'
import { cn } from '@/lib/utils'
import { PAGE_COPY } from '@/shared/ui-copy'

type MarketScopeSwitchProps = {
  scope: MarketScope
  discoverCount: number
  pocketCount: number
  onScopeChange: (scope: MarketScope) => void
  className?: string
}

export function MarketScopeSwitch({
  scope,
  discoverCount,
  pocketCount,
  onScopeChange,
  className,
}: MarketScopeSwitchProps) {
  return (
    <div className={cn('dp-market-scope-switch', className)} role="tablist" aria-label="道具库范围">
      {(
        [
          {
            value: 'discover' as const,
            label: PAGE_COPY.market.discoverScopeLabel,
            count: discoverCount,
          },
          { value: 'pocket' as const, label: PAGE_COPY.market.pocketSection, count: pocketCount },
        ] as const
      ).map(({ value, label, count }) => {
        const active = scope === value
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn('dp-market-scope-tab', active && 'dp-market-scope-tab-active')}
            onClick={() => onScopeChange(value)}
          >
            <span className="truncate">{label}</span>
            {count > 0 ? (
              <span
                className={cn(
                  'dp-market-scope-count',
                  active ? 'dp-market-scope-count-active' : 'dp-market-scope-count-idle',
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
