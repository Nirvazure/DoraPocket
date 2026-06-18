'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { LogOut, UserRound } from 'lucide-react'
import { useAuthSessionQuery } from '@/lib/query/auth-session'
import { cn } from '@/lib/utils'

type LoginEntryButtonProps = {
  active?: boolean
  className?: string
}

export function LoginEntryButton({ active = false, className }: LoginEntryButtonProps) {
  const { data } = useAuthSessionQuery()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const user = data?.authenticated && data && 'user' in data ? (data.user ?? null) : null

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  if (!user) {
    return (
      <Link
        href="/login"
        aria-current={active ? 'page' : undefined}
        className={cn('dp-top-profile-pill', active && 'dp-top-profile-pill-active', className)}
      >
        <ProfileAvatar src="/images/assistant-avatar.svg" active={active} />
        <span
          className={cn(
            'max-w-[7rem] truncate text-xs font-bold',
            active ? 'text-primary-foreground' : 'text-slate-800',
          )}
        >
          我的
        </span>
      </Link>
    )
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-current={active ? 'page' : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'dp-top-profile-pill cursor-pointer',
          active && 'dp-top-profile-pill-active',
          className,
        )}
      >
        <ProfileAvatar src={user.avatarSrc ?? '/images/assistant-avatar.svg'} active={active} />
        <span
          className={cn(
            'max-w-[7rem] truncate text-xs font-bold',
            active ? 'text-primary-foreground' : 'text-slate-800',
          )}
        >
          {user.nickname ?? '我的'}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-44 rounded-[1rem] border border-slate-200 bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700"
            onClick={() => setOpen(false)}
          >
            <UserRound className="h-4 w-4" />
            我的主页
          </Link>
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </a>
        </div>
      ) : null}
    </div>
  )
}

function ProfileAvatar({ src, active }: { src: string; active?: boolean }) {
  return (
    <span className={cn('dp-top-profile-avatar', active && 'border-primary-foreground/30')}>
      <Image
        src={src}
        alt="我的头像"
        width={28}
        height={28}
        unoptimized
        className="h-full w-full object-cover"
      />
    </span>
  )
}
