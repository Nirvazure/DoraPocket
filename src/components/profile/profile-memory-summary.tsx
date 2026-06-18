'use client'

import { Brain, CheckCircle2, History, ShieldCheck } from 'lucide-react'
import type { ProfileMemorySummary } from '@/shared/profile-memory'

type ProfileMemorySummaryProps = {
  summary: ProfileMemorySummary
  memoryEnabled?: boolean
}

export function ProfileMemorySummary({ summary, memoryEnabled = true }: ProfileMemorySummaryProps) {
  const topDirections = summary.directionStats.slice(0, 3)
  const signals = summary.preferenceSignals.slice(0, 6)

  return (
    <div className="rounded-[1.75rem] border border-sky-100 bg-sky-50/60 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
          <Brain className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-black text-slate-950">Dora 目前这样理解你</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {summary.totalCount > 0
              ? `已经整理 ${summary.totalCount} 次判断，形成 ${summary.directionStats.length} 个任务方向。`
              : '完成几次分析后，这里会整理出你的任务方向和偏好信号。'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <StatPill icon={<History className="h-4 w-4" />} label="判断" value={summary.totalCount} />
        <StatPill
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="收藏"
          value={summary.savedCount}
        />
        <StatPill
          icon={<ShieldCheck className="h-4 w-4" />}
          label="记忆"
          value={memoryEnabled ? '开' : '关'}
        />
      </div>

      {topDirections.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {topDirections.map((direction) => (
            <span
              key={direction.id}
              className="rounded-full border border-white bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm"
            >
              {direction.label} x{direction.count}
            </span>
          ))}
        </div>
      ) : null}

      {signals.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {signals.map((signal) => (
            <span
              key={signal}
              className="rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold text-sky-700"
            >
              {signal}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm shadow-sm">
      <span className="text-sky-600">{icon}</span>
      <span className="text-slate-500">{label}</span>
      <span className="ml-auto font-black text-slate-950">{value}</span>
    </div>
  )
}
