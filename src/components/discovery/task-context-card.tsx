type TaskContextCardProps = {
  currentPrompt: string
}

export function TaskContextCard({ currentPrompt }: TaskContextCardProps) {
  return (
    <article className="rounded-3xl border border-border/60 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">当前任务</p>
      <h3 className="mt-2 text-lg font-black leading-snug text-foreground">{currentPrompt}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        DoraPocket 会基于这个任务继续分析意图、比较候选，并给出这次最值得先用的帮助。
      </p>
    </article>
  )
}
