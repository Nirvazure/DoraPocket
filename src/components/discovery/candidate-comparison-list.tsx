import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DisplayPanel, DisplayPanelContent, DisplayPanelHeader, DisplayPanelTitle } from '@/components/ui/display-shell'
import { getToolById } from '@/services/tool-registry'
import type { AgentUiPayload } from '@/shared/market-types'

type CandidateComparisonListProps = {
  payload: AgentUiPayload | null
  onOpenCandidate: (toolId: string) => void
  onLaunchCandidate: (toolId: string) => void
}

function sourceLabel(value: 'builtin' | 'pocket' | 'market') {
  if (value === 'builtin') return '原生'
  if (value === 'pocket') return '口袋'
  return '市场'
}

export function CandidateComparisonList({ payload, onOpenCandidate, onLaunchCandidate }: CandidateComparisonListProps) {
  const candidates = payload?.candidates.slice(0, 3) ?? []

  return (
    <DisplayPanel className="rounded-3xl border-border/55 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <DisplayPanelHeader className="p-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">候选比较</p>
          <DisplayPanelTitle className="mt-1 text-lg">为什么是它，而不是另外两个</DisplayPanelTitle>
        </DisplayPanelHeader>
        <Badge variant="muted" className="bg-slate-100 px-3 py-1 text-[11px] font-semibold text-muted-foreground">最多 3 个</Badge>
      </div>
      {candidates.length === 0 ? (
        <DisplayPanel className="mt-4 rounded-2xl border-dashed bg-slate-50 px-4 py-6 text-center text-sm text-muted-foreground shadow-none">
          输入任务后，这里只展示最关键的 2 到 3 个候选，不再给你长列表。
        </DisplayPanel>
      ) : (
        <DisplayPanelContent className="mt-4 grid gap-3 p-0">
          {candidates.map((candidate, index) => {
            const tool = getToolById(candidate.toolId)
            const title = candidate.title ?? tool?.name ?? candidate.toolId
            const isLeader = index === 0
            return (
              <DisplayPanel key={candidate.toolId} className={isLeader ? 'rounded-3xl border-primary/25 bg-primary/[0.06] p-4 shadow-none' : 'rounded-3xl border-border/55 bg-slate-50 p-4 shadow-none'}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-foreground">TOP {index + 1} · {title}</p>
                    <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">{candidate.reason}</p>
                    <DisplayPanel className="mt-2 rounded-2xl border-white/80 bg-white/80 px-3 py-2 text-[11px] leading-relaxed text-foreground/75 shadow-none">
                      {isLeader ? '首选原因：这一项是当前任务最稳的起点。' : `暂不首选：当前轮次里，TOP 1 的综合信号更强。`}
                    </DisplayPanel>
                  </div>
                  <Badge variant="outline" className="border-border/55 bg-white px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                    {sourceLabel(candidate.sourceLabel)}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" className="h-8 rounded-full px-3 text-[11px]" onClick={() => onLaunchCandidate(candidate.toolId)}>
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    打开
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-8 rounded-full px-3 text-[11px]" onClick={() => onOpenCandidate(candidate.toolId)}>
                    比较依据
                  </Button>
                </div>
              </DisplayPanel>
            )
          })}
        </DisplayPanelContent>
      )}
    </DisplayPanel>
  )
}
