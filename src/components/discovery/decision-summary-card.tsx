import { ClipboardList, Compass, Loader2, MessageCircle, Target } from 'lucide-react'

import type { AgentUiPayload } from '@/shared/market-types'
import type { AppState } from '@/store'

type DecisionSummaryCardProps = {
  payload: AgentUiPayload | null
  currentPrompt: string | null
  appState: AppState
}

const SUMMARY_TILES = [
  { key: 'stage', label: '当前判断', Icon: Target },
  { key: 'missing', label: '缺失信息', Icon: ClipboardList },
  { key: 'feedback', label: '关键反馈', Icon: MessageCircle },
] as const

export function DecisionSummaryCard({
  payload,
  currentPrompt,
  appState,
}: DecisionSummaryCardProps) {
  const isThinking = appState === 'thinking'
  const missingInputs = payload?.taskFrame.missingInputs ?? []

  const bodies: Record<(typeof SUMMARY_TILES)[number]['key'], string> = {
    stage: payload?.stageLabel ?? '先识别任务，再比较工具。',
    missing: missingInputs.length > 0 ? missingInputs.join('、') : '暂不需要补充',
    feedback: isThinking ? '正在比较匹配度、成本与复用价值。' : '结果优先，过程静默。',
  }

  return (
    <section className="rounded-3xl border border-primary/15 bg-primary/[0.04] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            <Compass className="h-3.5 w-3.5 shrink-0" />
            任务理解
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
            {payload?.taskFrame.goal ?? currentPrompt?.trim() ?? '还没有任务输入'}
          </p>
        </div>
        {isThinking ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-3 py-1 text-[11px] font-semibold text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            正在裁决
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {SUMMARY_TILES.map(({ key, label, Icon }) => (
          <div key={key} className="rounded-3xl border border-border/60 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
              <Icon className="h-4 w-4" />
            </span>
            <span className="mt-3 block text-sm font-black text-foreground">{label}</span>
            <span className="mt-1 line-clamp-4 block text-xs leading-relaxed text-muted-foreground">
              {bodies[key]}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
