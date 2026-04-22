import { Compass, Loader2 } from 'lucide-react'
import type { AppState } from '@/store'
import type { AgentUiPayload } from '@/shared/market-types'

type DecisionSummaryCardProps = {
  payload: AgentUiPayload | null
  currentPrompt: string | null
  appState: AppState
  busyHint?: string
}

export function DecisionSummaryCard({ payload, currentPrompt, appState, busyHint }: DecisionSummaryCardProps) {
  const isThinking = appState === 'thinking'
  const missingInputs = payload?.taskFrame.missingInputs ?? []

  return (
    <section className="rounded-3xl border border-border/45 bg-slate-50/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <Compass className="h-3.5 w-3.5" />
            任务理解
          </div>
          <h3 className="mt-2 text-lg font-black text-foreground">
            {payload?.taskFrame.goal ?? currentPrompt?.trim() ?? '还没有任务输入'}
          </h3>
        </div>
        {isThinking ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            正在裁决
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border/55 bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-bold text-muted-foreground">当前判断</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{payload?.stageLabel ?? '先识别任务，再比较工具。'}</p>
        </div>
        <div className="rounded-2xl border border-border/55 bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-bold text-muted-foreground">缺失信息</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{missingInputs.length > 0 ? missingInputs.join('、') : '暂不需要补充'}</p>
        </div>
        <div className="rounded-2xl border border-border/55 bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-bold text-muted-foreground">关键反馈</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{busyHint || (isThinking ? '正在比较匹配度、成本与复用价值。' : '结果优先，过程静默。')}</p>
        </div>
      </div>
    </section>
  )
}
