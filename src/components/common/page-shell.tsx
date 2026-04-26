import type { ReactNode } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

type PageShellProps = {
  header: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function PageShell({
  header,
  children,
  className,
  contentClassName,
}: PageShellProps) {
  return (
    <div className={cn('h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(187,224,255,0.45),transparent_35%),linear-gradient(180deg,#f8fbff_0%,#edf4ff_46%,#eef2f7_100%)]', className)}>
      <div className="sticky top-0 z-30 bg-white/76 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-3 sm:px-6">{header}</div>
      </div>
      <ScrollArea className={cn('mx-auto flex h-[calc(100vh-5.25rem)] w-full max-w-[1440px] flex-col gap-5 px-4 pb-24 pt-3 sm:h-[calc(100vh-5.75rem)] sm:px-6 sm:pt-4 lg:h-[calc(100vh-6.25rem)] lg:pt-5', contentClassName)}>
        {children}
      </ScrollArea>
    </div>
  )
}
