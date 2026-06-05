import type { ReactNode } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PAGE_SHELL_CONTENT_X_CLASS, PAGE_SHELL_MAX_WIDTH_CLASS } from '@/shared/page-layout'
import { cn } from '@/lib/utils'

type PageShellProps = {
  header: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  /** 主内容区与顶栏共用最大宽度，默认与全站一致（约 1920px） */
  contentMaxWidthClassName?: string
}

export function PageShell({
  header,
  children,
  className,
  contentClassName,
  contentMaxWidthClassName = PAGE_SHELL_MAX_WIDTH_CLASS,
}: PageShellProps) {
  return (
    <div className={cn('dp-mesh-page-bg min-h-[100dvh] h-[100dvh] overflow-hidden', className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[hsl(var(--dora-blue-bright)/0.35)] blur-3xl" />
        <div className="absolute -right-20 top-8 h-64 w-64 rounded-full bg-[hsl(var(--accent-glow)/0.3)] blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-[min(100%,48rem)] -translate-x-1/2 rounded-full bg-[hsl(var(--primary)/0.2)] blur-3xl" />
      </div>
      <div className={cn('sticky top-0 z-30 pb-1 pt-4 sm:pt-5', PAGE_SHELL_CONTENT_X_CLASS)}>
        <div className={cn('relative mx-auto w-full', contentMaxWidthClassName)}>{header}</div>
      </div>
      <ScrollArea
        className={cn(
          'relative mx-auto flex h-[calc(100dvh-5.5rem)] w-full flex-col gap-5 pb-24 pt-2 sm:h-[calc(100dvh-6rem)] sm:pt-3 lg:h-[calc(100dvh-6.5rem)] lg:pt-4',
          PAGE_SHELL_CONTENT_X_CLASS,
          contentMaxWidthClassName,
          contentClassName,
        )}
      >
        {children}
      </ScrollArea>
    </div>
  )
}
