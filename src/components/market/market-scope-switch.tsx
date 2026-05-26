'use client'

import type { MarketScope } from '@/hooks/market-scope'
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
    <div
      className={cn(
        'flex w-full min-w-0 items-stretch rounded-xl border border-border/50 bg-white/60 p-0.5 min-h-10',
        className,
      )}
      role="tablist"
      aria-label="道具库范围"
    >
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
            className={cn(
              'flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 self-stretch rounded-[9px] px-2 py-0 text-[11px] font-semibold leading-none transition-colors duration-200',
              active
                ? 'bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(37,99,235,0.18)]'
                : 'text-slate-600 hover:bg-white/90 hover:text-slate-950',
            )}
            onClick={() => onScopeChange(value)}
          >
            <span className="truncate">{label}</span>
            {count > 0 ? (
              <span
                className={cn(
                  'shrink-0 rounded-full px-1 py-0.5 text-[9px] font-semibold leading-none',
                  active
                    ? 'bg-primary-foreground/15 text-primary-foreground'
                    : 'bg-slate-100 text-slate-500',
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
