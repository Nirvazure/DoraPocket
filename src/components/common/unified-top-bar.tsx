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
  chrome = 'inner-only',
  className,
}: UnifiedTopBarProps) {
  const content = (
    <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1.55rem] border border-white px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_24px_rgba(15,23,42,0.05)] bg-white">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          aria-label="返回引导页"
          className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/92 shadow-sm transition-transform hover:scale-[1.02]"
        >
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
            className="inline-flex h-10 items-center gap-1 rounded-full border border-border/60 bg-white/90 px-3 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-white sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </button>
        ) : null}
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <Link href="/" className="group inline-flex min-w-0 flex-col items-center sm:items-start">
          <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 sm:justify-start">
            <p className="truncate font-sans text-sm font-black tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-base">
              {title}
            </p>
          </div>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground transition-colors group-hover:text-foreground/80 sm:text-xs">
              {subtitle}
            </p>
          ) : null}
        </Link>
      </div>
      <div className="flex min-w-[2.75rem] items-center justify-end gap-2">
        {statusSlot ? <div className="hidden sm:flex">{statusSlot}</div> : null}
        {rightSlot ?? <span className="block h-10 w-10" />}
      </div>
    </div>
  )

  if (chrome === 'inner-only') {
    return <header className={cn('shrink-0 w-full', className)}>{content}</header>
  }

  return (
    <header className={cn('shrink-0 w-full', className)}>
      <div className="relative w-full rounded-[2rem] border border-white bg-white p-1.5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
        <div
          className="pointer-events-none absolute inset-x-8 top-1.5 h-px bg-gradient-to-r from-transparent via-white to-transparent"
          aria-hidden
        />
        {content}
      </div>
    </header>
  )
}
