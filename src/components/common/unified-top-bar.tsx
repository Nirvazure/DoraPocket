import type { ReactNode } from 'react'
import Image from 'next/image'
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
    <header className={cn('shrink-0 w-full', className)}>
      <div className="relative w-full rounded-[2rem] border border-white/80 bg-white/70 p-1.5 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-8 top-1.5 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" aria-hidden />
        <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1.55rem] border border-white/70 bg-white/72 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/92 shadow-sm">
              <Image src="/icon/pocket.png" alt="DoraPocket logo" width={40} height={40} className="h-9 w-9 object-contain" priority />
            </span>
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
            <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 sm:justify-start">
              <p className="truncate font-sans text-sm font-black tracking-tight text-foreground sm:text-base">{title}</p>
            </div>
            {subtitle ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">{subtitle}</p> : null}
          </div>
          <div className="flex min-w-[2.75rem] items-center justify-end gap-2">
            {statusSlot ? <div className="hidden sm:flex">{statusSlot}</div> : null}
            {rightSlot ?? <span className="block h-10 w-10" />}
          </div>
        </div>
      </div>
    </header>
  )
}
