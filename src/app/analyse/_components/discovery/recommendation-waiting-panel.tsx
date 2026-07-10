import { Loader2, PackageOpen } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  resolvePocketBarCopy,
  type AnalysisFlow,
} from '@/app/analyse/_domain/analysis-stage-content'

type RecommendationWaitingPanelProps = {
  analysisFlow: AnalysisFlow
}

export function RecommendationWaitingPanel({ analysisFlow }: RecommendationWaitingPanelProps) {
  const copy = resolvePocketBarCopy(analysisFlow)

  return (
    <section className="relative overflow-hidden rounded-[1.35rem] border border-primary/15 bg-white p-4 shadow-xl shadow-primary/5 sm:p-5">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,249,255,0.74))]"
        aria-hidden
      />
      <div className="relative z-10 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black text-foreground">{copy.title}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <PackageOpen className="h-4 w-4 text-sky-600" />
            {copy.detail}
          </p>
          <div className="mt-4 grid gap-2.5 md:grid-cols-3">
            <Skeleton className="h-20 rounded-[1rem] bg-sky-100/70" />
            <Skeleton className="h-20 rounded-[1rem] bg-slate-100" />
            <Skeleton className="h-20 rounded-[1rem] bg-slate-100" />
          </div>
        </div>
      </div>
    </section>
  )
}
