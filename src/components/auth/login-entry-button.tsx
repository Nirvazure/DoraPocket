'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import { useAuthSessionQuery } from '@/lib/query/auth-session'
import { cn } from '@/lib/utils'

type LoginEntryButtonProps = {
  active?: boolean
  className?: string
}

export function LoginEntryButton({ active = false, className }: LoginEntryButtonProps) {
  const { data, isPending } = useAuthSessionQuery()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const user = data?.authenticated === true && data && 'user' in data ? (data.user ?? null) : null

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const timerId = window.setTimeout(() => {
      window.addEventListener('click', handleClickOutside)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
      window.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  if (isPending && user == null) {
    return (
      <span
        aria-busy="true"
        className={cn('dp-top-profile-pill pointer-events-none opacity-80', className)}
      >
        <ProfileAvatar src="/images/assistant-avatar.svg" active={active} />
        <span className="max-w-[7rem] truncate text-xs font-bold text-slate-500">我的</span>
      </span>
    )
  }

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

  const profileLabel = user.nickname ?? '我的'
  const pillClassName = cn('dp-top-profile-pill', active && 'dp-top-profile-pill-active', className)
  const labelClassName = cn(
    'max-w-[7rem] truncate text-xs font-bold',
    active ? 'text-primary-foreground' : 'text-slate-800',
  )

  return (
    <div ref={menuRef} className="relative">
      <div className={cn(pillClassName, 'gap-1.5 pr-1.5')}>
        {active ? (
          <div className="flex min-w-0 items-center gap-2">
            <ProfileAvatar src={user.avatarSrc ?? '/images/assistant-avatar.svg'} active={active} />
            <span className={labelClassName}>{profileLabel}</span>
          </div>
        ) : (
          <Link
            href="/profile"
            aria-current={active ? 'page' : undefined}
            className="flex min-w-0 items-center gap-2"
          >
            <ProfileAvatar src={user.avatarSrc ?? '/images/assistant-avatar.svg'} active={active} />
            <span className={labelClassName}>{profileLabel}</span>
          </Link>
        )}

        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="账户菜单"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            setOpen((value) => !value)
          }}
          className={cn(
            'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors',
            active
              ? 'text-primary-foreground/85 hover:bg-primary-foreground/10'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
          )}
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
        </button>
      </div>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-44 rounded-[1rem] border border-slate-200 bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.14)]"
        >
          <a
            href="/api/auth/logout"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950"
            onClick={() => setOpen(false)}
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
