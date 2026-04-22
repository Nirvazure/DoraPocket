import { Compass, ExternalLink, FolderOpenDot, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getToolById } from '@/services/tool-registry'
import type { AgentUiPayload } from '@/shared/market-types'

type AgentInsightPanelProps = {
  payload: AgentUiPayload | null
  onOpenCandidate?: (toolId: string) => void
  onSaveCandidate?: (toolId: string) => void
  onSubscribeCandidate?: (toolId: string) => void
  onLaunchCandidate?: (toolId: string) => void
}

function sourceLabel(value: 'builtin' | 'pocket' | 'market') {
  if (value === 'builtin') return '原生'
  if (value === 'pocket') return '口袋'
  return '市场'
}

export function AgentInsightPanel({
  payload,
  onOpenCandidate,
  onSaveCandidate,
  onSubscribeCandidate,
  onLaunchCandidate,
}: AgentInsightPanelProps) {
  if (!payload) {
    return (
      <section className="rounded-[2rem] border border-primary/20 bg-white p-5 shadow-md">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
          <Compass className="h-3.5 w-3.5" />
          裁决中心
        </div>
        <h3 className="mt-2 text-2xl font-black tracking-tight text-foreground">结果先行，候选后置</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          输入一个任务后，这里只保留当前裁决、反向解释、下一步动作和是否值得沉淀。
        </p>
      </section>
    )
  }

  const [leader, runnerUp, third] = payload.candidates.slice(0, 3)
  const leaderTool = leader ? getToolById(leader.toolId) : null

  return (
    <section className="rounded-[2rem] border border-primary/20 bg-white p-5 shadow-md shadow-primary/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <Compass className="h-3.5 w-3.5" />
            裁决中心
          </div>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-foreground">
            {leaderTool?.name ?? leader?.title ?? payload.stageLabel}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{payload.selectionReason}</p>
        </div>
        {leader ? (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
            现在先用 TOP 1
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[1.75rem] border border-primary/20 bg-slate-950 p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">最终裁决</p>
          <p className="mt-2 text-3xl font-black tracking-tight">{leaderTool?.name ?? leader?.title ?? '等待输入'}</p>
          <p className="mt-3 text-sm leading-7 text-white/78">{leader?.reason ?? '输入任务后，这里会给出当前轮次唯一首选。'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {payload.selectionSignals.slice(0, 4).map((signal) => (
              <span key={signal} className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/82">
                {signal}
              </span>
            ))}
          </div>
          {leader ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" className="h-10 rounded-full bg-white px-4 text-xs font-bold text-slate-950 hover:bg-white/90" onClick={() => onLaunchCandidate?.(leader.toolId)}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                立即打开
              </Button>
              <Button type="button" variant="outline" className="h-10 rounded-full border-white/20 bg-white/10 px-4 text-xs font-bold text-white hover:bg-white/16" onClick={() => onSaveCandidate?.(leader.toolId)}>
                <FolderOpenDot className="mr-1.5 h-3.5 w-3.5" />
                收入口袋
              </Button>
            </div>
          ) : null}
        </article>

        <div className="space-y-4">
          <article className="rounded-3xl border border-border/55 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">为什么不是另外两个</p>
            <div className="mt-3 space-y-2">
              {[runnerUp, third].filter(Boolean).map((candidate, index) => {
                const tool = candidate ? getToolById(candidate.toolId) : null
                return (
                  <div key={candidate?.toolId} className="rounded-2xl border border-border/55 bg-white px-3 py-3">
                    <p className="text-sm font-black text-foreground">
                      TOP {index + 2} · {tool?.name ?? candidate?.title ?? candidate?.toolId}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      暂不首选：{candidate?.reason ?? '当前轮次里不是最稳妥的起点。'}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-foreground/70">
                      {candidate ? sourceLabel(candidate.sourceLabel) : ''}
                    </p>
                  </div>
                )
              })}
              {!runnerUp && !third ? (
                <div className="rounded-2xl border border-dashed border-border bg-white px-3 py-5 text-center text-xs text-muted-foreground">
                  候选压缩后，这里只保留最关键的反向解释。
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-3xl border border-border/55 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">下一步怎么做</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {payload.recommendedActions.slice(0, 3).map((action) => (
                <span key={action} className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/[0.05] px-3 py-1.5 text-[11px] font-semibold text-foreground">
                  <Sparkles className="h-3 w-3 text-primary" />
                  {action}
                </span>
              ))}
            </div>
            {leader ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="h-8 rounded-full px-3 text-[11px]" onClick={() => onOpenCandidate?.(leader.toolId)}>
                  查看比较依据
                </Button>
                {leaderTool?.subscriptionSupport ? (
                  <Button type="button" size="sm" variant="outline" className="h-8 rounded-full px-3 text-[11px]" onClick={() => onSubscribeCandidate?.(leader.toolId)}>
                    订阅
                  </Button>
                ) : null}
              </div>
            ) : null}
          </article>

          <article className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">是否值得沉淀</p>
            <p className="mt-2 text-sm font-semibold text-emerald-950">
              {payload.shouldAutoSave ? '值得：这轮结果适合固化为下次直接复用的入口。' : '暂缓：只有下次能明显省事的结果才值得沉淀。'}
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
