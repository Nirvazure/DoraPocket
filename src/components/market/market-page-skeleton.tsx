'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

const NAV_ROW_COUNT = 9
const MOBILE_CHIP_COUNT = 4
const CARD_PLACEHOLDER_COUNT = 6

export function MarketPageSkeleton() {
  return (
    <div
      className="grid min-h-0 gap-5 xl:grid-cols-[15rem_minmax(0,1fr)]"
      aria-busy="true"
      aria-label="市场内容加载中"
    >
      <aside className="hidden w-full min-h-0 flex-col overflow-hidden rounded-[1.5rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm xl:flex xl:self-start">
        <div className="shrink-0 border-b border-border/60 pb-3">
          <Skeleton className="h-8 w-full rounded-xl" />
        </div>
        <div className="mt-3 space-y-1.5 pb-2">
          {Array.from({ length: NAV_ROW_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-white/85 px-2 py-2"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-[55%] max-w-[7.5rem]" />
              </div>
              <Skeleton className="h-4 w-7 rounded-full" />
            </div>
          ))}
        </div>
      </aside>

      <div className="space-y-2 xl:hidden">
        <Skeleton className="h-8 w-full rounded-xl" />
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white/95 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white/95 to-transparent" />
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {Array.from({ length: MOBILE_CHIP_COUNT }).map((_, i) => (
              <div
                key={i}
                className="inline-flex h-9 w-[6.5rem] shrink-0 items-center gap-2 rounded-full border border-white/80 bg-white/88 px-3 shadow-sm"
              >
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-3 w-8 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 gap-4 xl:grid-rows-[auto_minmax(0,1fr)]">
        <section className="px-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Skeleton className="h-10 w-full flex-1 rounded-full" />
            <Skeleton className="h-10 w-full rounded-full sm:w-28" />
          </div>
        </section>

        <ScrollArea className="min-h-0 px-1">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: CARD_PLACEHOLDER_COUNT }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-40 flex-col rounded-[1.5rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-5 w-[80%]" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
                <div className="mt-auto flex items-end justify-between gap-2 pt-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-[10rem] max-w-[85%] rounded-md" />
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Skeleton className="h-8 w-[5.25rem] shrink-0 rounded-full" />
                    <Skeleton className="h-8 w-14 shrink-0 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
