export function WhereToStartSectionSkeleton() {
  return (
    <div className="flex min-h-full w-full flex-1 animate-pulse flex-col" aria-hidden>
      <div className="h-4 w-24 rounded bg-muted/50" />
      <div className="mt-4 flex gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-muted/45" />
        <div className="h-1.5 flex-1 rounded-full bg-muted/45" />
        <div className="h-1.5 flex-1 rounded-full bg-muted/30" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="h-20 rounded-[1.2rem] bg-muted/45" />
        <div className="h-20 rounded-[1.2rem] bg-muted/45" />
        <div className="h-20 rounded-[1.2rem] bg-muted/45" />
      </div>
      <div className="mt-4 h-11 rounded-full bg-muted/50" />
    </div>
  )
}
