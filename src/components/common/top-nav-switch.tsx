import Link from 'next/link'
import { cn } from '@/lib/utils'

type TopNavPage = 'intro' | 'analysis' | 'market' | 'pocket'

type TopNavSwitchProps = {
  current?: TopNavPage | 'profile'
  className?: string
}

const NAV_ITEMS: Array<{ key: TopNavPage; label: string; href: string }> = [
  { key: 'analysis', label: '分析', href: '/analyse' },
  { key: 'market', label: '道具库', href: '/market' },
]

export function TopNavSwitch({ current, className }: TopNavSwitchProps) {
  return (
    <nav className={cn('dp-top-nav-switch', className)} aria-label="主站导航">
      {NAV_ITEMS.map((item) => {
        const active = item.key === current
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn('dp-top-nav-tab', active && 'dp-top-nav-tab-active')}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
