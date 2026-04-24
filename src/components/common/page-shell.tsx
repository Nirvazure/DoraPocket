import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageShellProps = {
  header: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function PageShell({ header, children, className, contentClassName }: PageShellProps) {
  return (
    <div className={cn('h-screen overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(187,224,255,0.45),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#edf4ff_46%,#eef2f7_100%)] [scrollbar-width:thin]', className)}>
      <div className="sticky top-0 z-30 bg-white/76 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-3 sm:px-6">{header}</div>
      </div>
      <main className={cn('mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 pb-24 pt-3 sm:px-6 sm:pt-4 lg:pt-5', contentClassName)}>{children}</main>
    </div>
  )
}
