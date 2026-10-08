export function WhereToStartSectionSkeleton() {
  return (
    <div className="flex min-h-full w-full flex-1 animate-pulse flex-col gap-5" aria-hidden>
      <div>
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="mt-1 h-9 w-32 rounded bg-muted" />
        <div className="mt-2 h-5 w-56 max-w-full rounded bg-muted" />
      </div>
      <div className="border-y border-border/60 py-3">
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))]">
          {[2, 3].map((segments) => (
            <div key={segments}>
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="mt-1.5 flex gap-1 rounded-full border border-border/60 bg-muted p-0.5">
                {Array.from({ length: segments }, (_, index) => (
                  <div key={index} className="h-8 min-w-0 flex-1 rounded-full bg-white/70" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex min-h-7 items-center justify-between border-t border-border/45 pt-2">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-[18px] w-14 rounded bg-muted" />
        </div>
      </div>
      <div className="grid gap-2.5 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-32 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="min-h-56 flex-1 rounded-lg bg-muted" />
    </div>
  )
}
