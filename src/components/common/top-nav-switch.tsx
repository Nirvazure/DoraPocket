import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type TopNavPage = 'analysis' | 'market' | 'pocket' | 'profile'

type TopNavSwitchProps = {
  current: TopNavPage
  className?: string
}

const NAV_ITEMS: Array<{ key: TopNavPage; label: string; href: string }> = [
  { key: 'analysis', label: '分析', href: '/' },
  { key: 'market', label: '市场', href: '/market' },
  { key: 'pocket', label: '口袋', href: '/pocket' },
]

export function TopNavSwitch({ current, className }: TopNavSwitchProps) {
  return (
    <div className={cn('inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100/90 p-1 shadow-sm', className)}>
      {NAV_ITEMS.map((item) => {
        const active = item.key === current
        return (
          <Button
            key={item.key}
            asChild
            size="sm"
            variant={active ? 'default' : 'ghost'}
            className={cn(
              'rounded-full px-3 text-xs font-bold',
              active ? 'shadow-sm' : 'text-foreground/75 hover:bg-white hover:text-foreground',
            )}
          >
            <Link href={item.href} aria-current={active ? 'page' : undefined}>
              {item.label}
            </Link>
          </Button>
        )
      })}
    </div>
  )
}
