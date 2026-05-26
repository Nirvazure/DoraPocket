import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import {
  isRecommendationCovered,
  isRecommendationRevealing,
  type AnalysisFlow,
} from '@/components/discovery/analysis-stage-content'
import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { Skeleton } from '@/components/ui/skeleton'

type ActionClosureCardProps = {
  leaderToolId: string | null
  analysisFlow: AnalysisFlow
  onOpenPocket: () => void
  onFeedback: (toolId: string, vote: 'up' | 'down') => void
}

const FEEDBACK_OPTIONS = ['解决了', '不适合', '太复杂', '太贵', '想换一个'] as const

export function ActionClosureCard({
  leaderToolId,
  analysisFlow,
  onOpenPocket,
  onFeedback,
}: ActionClosureCardProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null)
  const covered = isRecommendationCovered(analysisFlow)
  const revealing = isRecommendationRevealing(analysisFlow)

  if (covered) {
    return (
      <DisplayPanel className="rounded-[1.8rem] border-border/70 bg-white shadow-sm">
        <DisplayPanelHeader className="space-y-2">
          <Skeleton className="h-3 w-20 bg-slate-200" />
          <Skeleton className="h-7 w-64 max-w-full bg-slate-200" />
        </DisplayPanelHeader>
        <DisplayPanelContent className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="rounded-3xl border border-border/60 bg-slate-50/90 p-4">
            <Skeleton className="h-4 w-full max-w-md bg-slate-200" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24 rounded-full bg-slate-200" />
              <Skeleton className="h-8 w-16 rounded-full bg-slate-200" />
            </div>
          </div>
          <DisplayPanel className="rounded-3xl border-border/60 bg-white p-3 shadow-none">
            <Skeleton className="h-3 w-24 bg-slate-200" />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-7 w-14 rounded-full bg-slate-200" />
              ))}
            </div>
          </DisplayPanel>
        </DisplayPanelContent>
      </DisplayPanel>
    )
  }

  const recordFeedback = (option: (typeof FEEDBACK_OPTIONS)[number]) => {
    setSelectedFeedback(option)
    if (!leaderToolId) return
    onFeedback(leaderToolId, option === '解决了' ? 'up' : 'down')
  }

  return (
    <DisplayPanel className="rounded-[1.8rem] border-border/70 bg-white shadow-sm">
      <DisplayPanelHeader className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">行动闭环</p>
        <DisplayPanelTitle className="text-xl text-foreground">
          试用之后，把结果留在你的口袋里
        </DisplayPanelTitle>
      </DisplayPanelHeader>
      <DisplayPanelContent
        className={
          revealing
            ? 'grid animate-in fade-in duration-300 gap-3 lg:grid-cols-[1fr_auto]'
            : 'grid gap-3 lg:grid-cols-[1fr_auto]'
        }
      >
        <div className="rounded-3xl border border-border/60 bg-slate-50/90 p-4">
          <p className="text-sm font-semibold text-foreground">
            试用之后，如果你觉得这次真的有用，再把它留作下次的可复用入口。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full px-3 text-[11px]"
              onClick={onOpenPocket}
            >
              查看我的口袋
            </Button>
          </div>
        </div>
        <DisplayPanel className="rounded-3xl border-border/60 bg-white p-3 shadow-none">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              这次解决了吗？
            </p>
            {selectedFeedback ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {leaderToolId
              ? FEEDBACK_OPTIONS.map((option) => (
                  <Button
                    key={option}
                    type="button"
                    variant={selectedFeedback === option ? 'default' : 'outline'}
                    className={
                      selectedFeedback === option
                        ? 'h-auto rounded-full px-2.5 py-1 text-[11px]'
                        : 'h-auto rounded-full border-border/70 bg-slate-50 px-2.5 py-1 text-[11px] text-foreground/75 hover:border-primary/25'
                    }
                    onClick={() => recordFeedback(option)}
                  >
                    {option}
                  </Button>
                ))
              : null}
          </div>
          {selectedFeedback ? (
            <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
              已记录：下次会参考这次反馈。
            </p>
          ) : null}
        </DisplayPanel>
      </DisplayPanelContent>
    </DisplayPanel>
  )
}
