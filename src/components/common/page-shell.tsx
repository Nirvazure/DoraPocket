import type { ReactNode } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

type PageShellProps = {
  header: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  /** 主内容区与顶栏共用最大宽度，默认 1440px */
  contentMaxWidthClassName?: string
}

export function PageShell({
  header,
  children,
  className,
  contentClassName,
  contentMaxWidthClassName = 'max-w-[1440px]',
}: PageShellProps) {
  return (
    <div className={cn('dp-mesh-page-bg h-screen overflow-hidden', className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[hsl(var(--dora-blue-bright)/0.35)] blur-3xl" />
        <div className="absolute -right-20 top-8 h-64 w-64 rounded-full bg-[hsl(var(--accent-glow)/0.3)] blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-[min(100%,48rem)] -translate-x-1/2 rounded-full bg-[hsl(var(--primary)/0.2)] blur-3xl" />
      </div>
      <div className="sticky top-0 z-30 px-4 pb-1 pt-4 sm:px-6 sm:pt-5">
        <div className={cn('relative mx-auto w-full', contentMaxWidthClassName)}>{header}</div>
      </div>
      <ScrollArea
        className={cn(
          'relative mx-auto flex h-[calc(100vh-5.5rem)] w-full flex-col gap-5 px-4 pb-24 pt-2 sm:h-[calc(100vh-6rem)] sm:px-6 sm:pt-3 lg:h-[calc(100vh-6.5rem)] lg:pt-4',
          contentMaxWidthClassName,
          contentClassName,
        )}
      >
        {children}
      </ScrollArea>
    </div>
  )
}
