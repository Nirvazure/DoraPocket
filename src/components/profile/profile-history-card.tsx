'use client'

import { useState } from 'react'
import { BookmarkCheck, CheckCircle2, ChevronDown, ExternalLink } from 'lucide-react'
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
    <article className="rounded-[1.2rem] border border-slate-200 bg-white p-4 transition-colors hover:border-sky-200">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-bold text-sky-700">{direction.label}</span>
        <span className="h-1 w-1 rounded-full bg-slate-300" />
        <span className="text-slate-400">{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
        {item.confidenceLevel === 'low' ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 font-bold text-amber-700">
            低置信度
          </span>
        ) : null}
        {actionBadges.map(({ label, icon: Icon }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 font-bold text-slate-600"
          >
            <Icon className="h-3 w-3" />
            {label}
          </span>
        ))}
      </div>

      <div className="mt-3">
        <h3 className="line-clamp-2 text-base font-black leading-6 text-slate-950">
          {item.userText}
        </h3>
        <p className={cn('mt-2 text-sm leading-6 text-slate-600', !expanded && 'line-clamp-2')}>
          {item.finalText}
        </p>
      </div>

      {expanded ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
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
        </div>
      ) : null}

      <div className="mt-3 flex items-center">
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
