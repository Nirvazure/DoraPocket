'use client'

import { BadgeCheck, History } from 'lucide-react'
import { getToolById } from '@/services/tool-registry'
import type { ChatHistoryEntry } from '@/services/chat-history'

type ActivityItem = {
  id: string
  title: string
  detail: string
  createdAt: number
}

type ProfileTimelineSectionProps = {
  feedbackCount: number
  subscriptionCount: number
  archivedCount: number
  activities: ActivityItem[]
  history: ChatHistoryEntry[]
  formatTime: (value: number) => string
}

export function ProfileTimelineSection({
  feedbackCount,
  subscriptionCount,
  archivedCount,
  activities,
  history,
  formatTime,
}: ProfileTimelineSectionProps) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/90 p-3 shadow-xl shadow-slate-900/8 backdrop-blur-xl sm:p-4">
      <div className="rounded-[1.65rem] border border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,247,255,0.96))] p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              <History className="h-3.5 w-3.5" />
              个人时间流
            </p>
            <h2 className="mt-2 text-xl font-black text-foreground sm:text-[1.6rem]">最近哪些轨迹正在影响下一次裁决？</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">左侧保留主阅读带：先看回流，再看最近的对话回看。</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[17rem]">
            {[
              { label: '反馈', value: feedbackCount },
              { label: '订阅', value: subscriptionCount },
              { label: '归档', value: archivedCount },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/80 bg-white/88 px-3 py-2.5 shadow-sm">
                <p className="text-lg font-black leading-none text-primary">{item.value}</p>
                <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <div className="rounded-[1.65rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              <BadgeCheck className="h-3.5 w-3.5" />
              行为回流
            </div>
            <span className="rounded-full bg-primary/[0.08] px-2.5 py-1 text-[11px] font-semibold text-primary">{activities.length} 条最近动作</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {activities.length > 0 ? (
              activities.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-border/60 bg-white/88 px-3 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/12 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.07)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-foreground">{item.title}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{formatTime(item.createdAt)}</span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-white/80 p-6 text-center text-sm font-semibold text-muted-foreground">
                暂无近期回流。打开、收藏、订阅、反馈都会在这里留下痕迹。
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.65rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              <History className="h-3.5 w-3.5" />
              对话回看
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{history.length} 条最近记录</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white/80 p-6 text-center text-sm font-semibold text-muted-foreground">
                暂无对话历史。完成一次分析后，完整问答会保存在这里。
              </div>
            ) : (
              history.map((entry) => {
                const tool = getToolById(entry.selectedToolId)
                return (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-border/60 bg-white/88 px-3 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/12 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.07)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="rounded-full bg-primary/[0.08] px-2 py-0.5 text-[11px] font-bold text-primary">{formatTime(entry.createdAt)}</p>
                      {tool ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{tool.name}</span> : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-black text-foreground">{entry.userText}</p>
                    <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{entry.assistantText}</p>
                  </article>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
