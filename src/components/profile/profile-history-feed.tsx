'use client'

import { AlertCircle, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileHistoryCard } from '@/components/profile/profile-history-card'
import {
  filterProfileHistory,
  type ProfileHistoryStatusFilter,
  type ProfileTaskDirectionId,
  type RecommendationHistoryItem,
} from '@/shared/profile-memory'

type ProfileHistoryFeedProps = {
  items: RecommendationHistoryItem[]
  selectedDirectionId: ProfileTaskDirectionId
  statusFilter: ProfileHistoryStatusFilter
  loading?: boolean
  error?: boolean
  onStatusFilterChange: (status: ProfileHistoryStatusFilter) => void
}

const FILTERS: Array<{ id: ProfileHistoryStatusFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'saved', label: '已收藏' },
  { id: 'evaluated', label: '已评价' },
  { id: 'low_confidence', label: '低置信度' },
]

export function ProfileHistoryFeed({
  items,
  selectedDirectionId,
  statusFilter,
  loading,
  error,
  onStatusFilterChange,
}: ProfileHistoryFeedProps) {
  const filtered = filterProfileHistory(items, {
    directionId: selectedDirectionId,
    status: statusFilter,
  })

  return (
    <section className="rounded-[2rem] border border-white/90 bg-white p-5 shadow-[0_28px_86px_rgba(14,165,233,0.06)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-sky-600">
            <History className="h-4 w-4" />
            判断记录
          </div>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
            每一次输入、输出和后续动作，都会沉淀成可回看的任务记忆。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onStatusFilterChange(filter.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-black transition-colors',
                statusFilter === filter.id
                  ? 'border-sky-300 bg-sky-500 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:bg-sky-50',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-[1.5rem] bg-slate-100" />
          ))
        ) : error ? (
          <EmptyState
            icon={<AlertCircle className="h-5 w-5" />}
            title="判断记录暂时加载失败"
            description="请稍后再试。"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<History className="h-5 w-5" />}
            title="还没有判断记录"
            description="去让 Dora 分析一次任务，这里会出现第一张任务票据。"
          />
        ) : (
          filtered.map((item) => <ProfileHistoryCard key={item.id} item={item} />)
        )}
      </div>
    </section>
  )
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
        {icon}
      </span>
      <p className="mt-3 text-sm font-black text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}
