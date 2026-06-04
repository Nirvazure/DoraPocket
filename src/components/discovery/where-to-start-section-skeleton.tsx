export function WhereToStartSectionSkeleton() {
  return (
    <div className="flex min-h-full flex-col gap-3 animate-pulse" aria-hidden>
      <div className="flex flex-1 flex-col space-y-4 rounded-[1.8rem] bg-muted/35 p-4">
        <div className="h-4 w-24 rounded bg-muted/50" />
        <div className="flex gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-muted/45" />
          <div className="h-1.5 flex-1 rounded-full bg-muted/45" />
          <div className="h-1.5 flex-1 rounded-full bg-muted/45" />
          <div className="h-1.5 flex-1 rounded-full bg-muted/30" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-20 rounded-[1.2rem] bg-muted/45" />
          <div className="h-20 rounded-[1.2rem] bg-muted/45" />
          <div className="h-20 rounded-[1.2rem] bg-muted/45" />
        </div>
        <div className="h-11 rounded-full bg-muted/50" />
      </div>
      <div className="h-40 rounded-[1.8rem] bg-muted/25" />
    </div>
  )
}
