'use client'

import { useState } from 'react'
import { BookmarkCheck, CheckCircle2, ChevronDown, ExternalLink, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveTaskDirection, type RecommendationHistoryItem } from '@/shared/profile-memory'

type ProfileHistoryCardProps = {
  item: RecommendationHistoryItem
}

export function ProfileHistoryCard({ item }: ProfileHistoryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const direction = resolveTaskDirection(item)
  const actionBadges = [
    item.openedToolId ? { label: '已打开', icon: ExternalLink } : null,
    item.savedToolId ? { label: '已收藏', icon: BookmarkCheck } : null,
    item.evaluatedAt ? { label: '已评价', icon: CheckCircle2 } : null,
  ].filter(Boolean) as Array<{ label: string; icon: typeof ExternalLink }>
  const signals = [...item.preferenceSignals, ...item.taskFrame.constraints].slice(0, 4)

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-sky-200">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-sky-50 px-2.5 py-1 font-black text-sky-700">
          {direction.label}
        </span>
        <span className="text-slate-400">{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
        {item.confidenceLevel === 'low' ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-700">
            低置信度
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[1.1rem] bg-slate-50 px-3 py-3">
          <p className="text-xs font-black text-slate-500">我当时问</p>
          <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-800">{item.userText}</p>
        </div>
        <div className="rounded-[1.1rem] border border-sky-100 bg-sky-50/60 px-3 py-3">
          <p className="flex items-center gap-1.5 text-xs font-black text-sky-700">
            <Sparkles className="h-3.5 w-3.5" />
            Dora 判断
          </p>
          <p className={cn('mt-1 text-sm leading-6 text-slate-800', !expanded && 'line-clamp-3')}>
            {item.finalText}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {item.selectedToolId ? (
          <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">
            首推：{item.selectedToolId}
          </span>
        ) : null}
        {signals.map((signal) => (
          <span
            key={signal}
            className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700"
          >
            {signal}
          </span>
        ))}
        {actionBadges.map(({ label, icon: Icon }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </span>
        ))}
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          {expanded ? '收起' : '展开'}
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')}
          />
        </button>
      </div>
    </article>
  )
}
