import { BrainCircuit, CheckCircle2, Circle, Loader2, Sparkles } from 'lucide-react'
import type { AppState } from '@/store'
import type { AgentUiPayload } from '@/shared/market-types'

type DecisionThinkingRailProps = {
  payload: AgentUiPayload | null
  appState: AppState
  currentPrompt: string | null
  busyHint?: string
}

function modeLabel(mode?: AgentUiPayload['taskFrame']['mode']) {
  if (mode === 'use_builtin') return '识别到可直接执行的原生能力'
  if (mode === 'manage_pocket') return '识别到口袋管理任务'
  if (mode === 'answer_book') return '识别到需要从口袋里选答案'
  if (mode === 'chat') return '识别到需要先理清问题'
  return '识别任务与限制'
}

export function DecisionThinkingRail({ payload, appState, currentPrompt, busyHint }: DecisionThinkingRailProps) {
  const hasPrompt = Boolean(currentPrompt?.trim())
  const isThinking = appState === 'thinking'
  const trail = payload?.stageTrail ?? []
  const steps = [
    {
      title: '读懂处境',
      detail: payload?.taskFrame.goal || currentPrompt?.trim() || '等待你说清卡点、任务和限制。',
      active: hasPrompt && !payload,
      done: Boolean(payload?.taskFrame.goal),
    },
    {
      title: '判断任务类型',
      detail: modeLabel(payload?.taskFrame.mode),
      active: isThinking || Boolean(payload?.taskFrame.mode),
      done: Boolean(payload?.taskFrame.mode),
    },
    {
      title: '比较候选帮助',
      detail: trail[0] || payload?.selectionSignals[0] || '比较匹配度、启动成本、复用价值和可信度。',
      active: isThinking || Boolean(payload?.candidates.length),
      done: Boolean(payload?.candidates.length),
    },
    {
      title: '形成裁决',
      detail: payload?.selectionReason || busyHint || '收敛成“这次先用它”，不把你丢给长列表。',
      active: isThinking || Boolean(payload?.selectionReason),
      done: Boolean(payload?.selectionReason),
    },
  ]

  return (
    <section className="overflow-hidden rounded-[2rem] border border-primary/15 bg-white p-4 shadow-lg shadow-primary/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            <BrainCircuit className="h-3.5 w-3.5" />
            Thinking Track
          </p>
          <h3 className="mt-1 text-lg font-black text-foreground">
            {isThinking ? 'DoraPocket 正在替你做裁决' : payload ? '这次裁决是这样收敛出来的' : '先说任务，我会把判断过程放在这里'}
          </h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-slate-50 px-3 py-1 text-xs font-semibold text-muted-foreground">
          {isThinking ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
          可见但不打扰
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className={
              step.done
                ? 'rounded-3xl border border-primary/20 bg-primary/[0.055] p-3'
                : step.active
                  ? 'rounded-3xl border border-sky-200 bg-sky-50 p-3'
                  : 'rounded-3xl border border-border/60 bg-slate-50 p-3'
            }
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-muted-foreground">0{index + 1}</span>
              {step.done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground/55" />}
            </div>
            <p className="mt-3 text-sm font-black text-foreground">{step.title}</p>
            <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">{step.detail}</p>
          </article>
        ))}
      </div>

      {payload && (payload.preferenceSignals.length > 0 || payload.selectionSignals.length > 0) ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-border/60 bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">适合你的信号</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(payload.preferenceSignals.length ? payload.preferenceSignals : ['还在等待偏好信号']).slice(0, 4).map((signal) => (
                <span key={signal} className="rounded-full border border-white/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground/75">
                  {signal}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border/60 bg-slate-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">这次首选依据</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(payload.selectionSignals.length ? payload.selectionSignals : ['等待裁决信号']).slice(0, 4).map((signal) => (
                <span key={signal} className="rounded-full border border-white/80 bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground/75">
                  {signal}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
