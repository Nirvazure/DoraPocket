'use client'

import Image from 'next/image'
import { Compass, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  PROFILE_TASK_DIRECTIONS,
  type ProfileDirectionStat,
  type ProfileTaskDirectionId,
} from '@/shared/profile-memory'

type ProfileTaskCompassProps = {
  user: {
    nickname?: string | null
    email?: string | null
    avatarSrc?: string | null
  } | null
  selectedDirectionId: ProfileTaskDirectionId
  directionStats: ProfileDirectionStat[]
  disabled?: boolean
  onSelectDirection: (directionId: ProfileTaskDirectionId) => void
}

export function ProfileTaskCompass({
  user,
  selectedDirectionId,
  directionStats,
  disabled,
  onSelectDirection,
}: ProfileTaskCompassProps) {
  const statMap = new Map(directionStats.map((stat) => [stat.id, stat]))
  const directions = PROFILE_TASK_DIRECTIONS.filter((direction) => direction.id !== 'general')

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/90 bg-white p-5 shadow-[0_28px_86px_rgba(14,165,233,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-sky-600">
            <Compass className="h-4 w-4" />
            Dora 任务罗盘
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">我的任务记忆</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">
            从你的判断记录里整理任务方向，帮助 Dora 下次更快理解你。
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectDirection('all')}
          className={cn(
            'shrink-0 rounded-full border px-4 py-2 text-xs font-black transition-colors',
            selectedDirectionId === 'all'
              ? 'border-sky-300 bg-sky-500 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          全部
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[240px_1fr] lg:items-center">
        <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-sky-100 bg-sky-50/70 p-5 text-center">
          <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.6rem] border border-white bg-white shadow-sm">
            {user?.avatarSrc ? (
              <Image
                src={user.avatarSrc}
                alt="我的头像"
                width={80}
                height={80}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-8 w-8 text-sky-600" />
            )}
          </span>
          <div className="mt-3 max-w-full">
            <p className="truncate text-lg font-black text-slate-950">
              {user?.nickname ?? '未登录用户'}
            </p>
            <p className="mt-1 truncate text-xs text-slate-500">
              {user?.email ?? '登录后同步任务记忆'}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {directions.map((direction) => {
            const stat = statMap.get(direction.id)
            const selected = selectedDirectionId === direction.id
            return (
              <button
                key={direction.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelectDirection(direction.id)}
                className={cn(
                  'group min-h-[112px] cursor-pointer rounded-[1.4rem] border bg-white p-3 text-left transition-colors',
                  selected
                    ? 'border-sky-300 bg-sky-50 shadow-sm'
                    : 'border-slate-200 hover:border-sky-200 hover:bg-sky-50/70',
                  disabled && 'cursor-not-allowed opacity-55',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn('h-2.5 w-2.5 rounded-full', stat ? 'bg-sky-500' : 'bg-slate-200')}
                  />
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-600">
                    {stat?.count ?? 0}
                  </span>
                </div>
                <p className="mt-3 text-sm font-black text-slate-950">{direction.label}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {stat?.signals.join(' / ') || direction.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
