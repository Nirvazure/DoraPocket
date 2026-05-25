'use client'

import { Button } from '@/components/ui/button'
import type { MarketScope } from '@/hooks/market-scope'
import { cn } from '@/lib/utils'
import { PAGE_COPY } from '@/shared/ui-copy'

type MarketScopeSwitchProps = {
  scope: MarketScope
  pocketCount: number
  onScopeChange: (scope: MarketScope) => void
  className?: string
}

export function MarketScopeSwitch({
  scope,
  pocketCount,
  onScopeChange,
  className,
}: MarketScopeSwitchProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border border-slate-200/80 bg-slate-100/90 p-1 shadow-sm',
        className,
      )}
    >
      <Button
        type="button"
        size="sm"
        variant={scope === 'discover' ? 'default' : 'ghost'}
        className={cn(
          'rounded-full px-3 text-xs font-bold',
          scope === 'discover'
            ? 'shadow-sm'
            : 'text-foreground/75 hover:bg-white hover:text-foreground',
        )}
        onClick={() => onScopeChange('discover')}
      >
        {PAGE_COPY.market.discoverScopeLabel}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={scope === 'pocket' ? 'default' : 'ghost'}
        className={cn(
          'rounded-full px-3 text-xs font-bold',
          scope === 'pocket'
            ? 'shadow-sm'
            : 'text-foreground/75 hover:bg-white hover:text-foreground',
        )}
        onClick={() => onScopeChange('pocket')}
      >
        {PAGE_COPY.market.pocketSection}
        {pocketCount > 0 ? (
          <span
            className={cn(
              'ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
              scope === 'pocket'
                ? 'bg-primary-foreground/15 text-primary-foreground'
                : 'bg-slate-200/90 text-foreground/70',
            )}
          >
            {pocketCount}
          </span>
        ) : null}
      </Button>
    </div>
  )
}
