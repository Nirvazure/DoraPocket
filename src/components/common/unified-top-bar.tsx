import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type UnifiedTopBarProps = {
  title: string
  subtitle?: string
  onBack?: () => void
  backLabel?: string
  leftSlot?: ReactNode
  statusSlot?: ReactNode
  rightSlot?: ReactNode
  /** @deprecated 已统一为 Egloo 式单层胶囊外壳，保留仅为兼容 */
  chrome?: 'double' | 'inner-only'
  className?: string
}

export function UnifiedTopBar({
  title,
  subtitle,
  onBack,
  backLabel = '返回',
  leftSlot,
  statusSlot,
  rightSlot,
  className,
}: UnifiedTopBarProps) {
  return (
    <header className={cn('dp-top-bar-shell shrink-0', className)}>
      <div className="dp-top-bar">
        <div className="dp-top-bar-inner">
          <div className="flex items-center gap-2">
            <Link href="/" aria-label="返回引导页" className="dp-top-bar-logo">
              <Image
                src="/images/pocket.png"
                alt="DoraPocket logo"
                width={40}
                height={40}
                className="h-9 w-9 object-contain"
                priority
              />
            </Link>
            {leftSlot ? (
              leftSlot
            ) : onBack ? (
              <button
                type="button"
                onClick={onBack}
                aria-label={backLabel}
                className="dp-top-bar-back"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </button>
            ) : null}
          </div>

          <div className="min-w-0 px-1 text-center sm:px-2 sm:text-left">
            <div className="inline-flex min-w-0 max-w-full flex-col items-center sm:items-start">
              <p className="dp-top-bar-title">{title}</p>
              {subtitle ? <p className="dp-top-bar-subtitle">{subtitle}</p> : null}
            </div>
          </div>

          <div className="dp-top-bar-actions">
            {statusSlot ? <div className="hidden lg:flex">{statusSlot}</div> : null}
            {rightSlot ?? <span className="block h-10 w-10" aria-hidden />}
          </div>
        </div>
      </div>
    </header>
  )
}
