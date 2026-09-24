import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LoginEntryButton } from '@/components/auth/login-entry-button'
import { cn } from '@/lib/utils'
import { APP_NAV_ITEMS, type AppNavPage } from './app-nav-config'

export type { AppNavPage } from './app-nav-config'

type AppNavProps = {
  current?: AppNavPage
  variant?: 'app' | 'auth'
  className?: string
}

export function AppNav({ current, variant = 'app', className }: AppNavProps) {
  if (variant === 'auth') {
    return (
      <Link href="/analyse" className={cn('dp-top-bar-back', className)}>
        <ArrowLeft className="h-4 w-4" />
        返回分析
      </Link>
    )
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-1.5 sm:gap-2', className)}>
      <nav className="dp-top-nav-switch" aria-label="主站导航">
        {APP_NAV_ITEMS.map((item) => {
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
      <LoginEntryButton active={current === 'profile'} compactOnMobile />
    </div>
  )
}
