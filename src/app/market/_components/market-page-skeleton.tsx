'use client'

import { Skeleton } from '@/components/ui/skeleton'

const CATEGORY_TILE_COUNT = 8
const FEATURED_CARD_COUNT = 4
const GRID_CARD_COUNT = 9

function MarketSkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        'dp-market-skeleton-card flex min-h-44 flex-col justify-between rounded-[1.75rem] p-4'
      }
    >
      <div className="flex items-start gap-3">
        <Skeleton className="size-14 shrink-0 rounded-[1.2rem]" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4 rounded-full" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Skeleton className="h-3 w-4/5 rounded-full" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
    </div>
  )
}

export function MarketToolGridSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="工具列表加载中">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: GRID_CARD_COUNT }).map((_, i) => (
          <MarketSkeletonCard
            key={i}
            className="dp-market-skeleton-card flex min-h-40 flex-col justify-between rounded-[1.65rem] p-4"
          />
        ))}
      </div>
    </div>
  )
}

export function MarketPageSkeleton() {
  return (
    <div className="dp-market-workbench" aria-busy="true" aria-label="市场内容加载中">
      <aside className="dp-market-sidebar hidden xl:flex xl:self-start">
        <div className="dp-market-sidebar-scroll">
          <div className="rounded-[1.5rem] border border-white/85 bg-white/80 p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-[1.15rem]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-full" />
              </div>
              <Skeleton className="size-8 rounded-full" />
            </div>
          </div>

          <div className="mt-4 px-1">
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {Array.from({ length: CATEGORY_TILE_COUNT }).map((_, i) => (
              <div key={i} className="rounded-[1.35rem] border border-white/80 bg-white/76 p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-[1rem]" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-3 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <div className="space-y-2.5 xl:hidden">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="inline-flex h-10 w-[7rem] shrink-0 items-center gap-2 rounded-full border border-white/80 bg-white/85 px-3 shadow-sm"
            >
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-3 w-8 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="dp-market-content-shell">
        <section className="px-1">
          <div className="dp-market-toolbar-shell">
            <Skeleton className="h-11 w-full max-w-[28rem] rounded-full" />
            <Skeleton className="h-11 w-28 rounded-full" />
          </div>
        </section>

        <div className="dp-market-body-slot px-1 pb-1">
          <section className="dp-market-showcase-shell">
            <div className="dp-market-showcase-head">
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-24 rounded-full" />
                <Skeleton className="h-8 w-80 rounded-full" />
              </div>
              <Skeleton className="h-4 w-72 max-w-full rounded-full" />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
              <div className="dp-market-skeleton-card flex min-h-64 flex-col justify-between rounded-[2rem] p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="size-20 shrink-0 rounded-[1.5rem]" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <Skeleton className="h-3.5 w-24 rounded-full" />
                    <Skeleton className="h-8 w-[70%] rounded-full" />
                    <Skeleton className="h-4 w-full rounded-full" />
                    <Skeleton className="h-4 w-5/6 rounded-full" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Skeleton className="h-16 rounded-[1.2rem]" />
                  <Skeleton className="h-16 rounded-[1.2rem]" />
                  <Skeleton className="h-16 rounded-[1.2rem]" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: FEATURED_CARD_COUNT }).map((_, i) => (
                  <MarketSkeletonCard
                    key={i}
                    className="dp-market-skeleton-card flex min-h-40 flex-col justify-between rounded-[1.45rem] p-4"
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="dp-market-pocket-fab-skeleton" aria-hidden>
        <Skeleton className="size-16 rounded-full" />
      </div>
    </div>
  )
}
