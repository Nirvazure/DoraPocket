'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useAuthSessionQuery } from '@/lib/query/auth-session'
import { cn } from '@/lib/utils'

type LoginEntryButtonProps = {
  active?: boolean
  className?: string
}

export function LoginEntryButton({ active = false, className }: LoginEntryButtonProps) {
  const { data } = useAuthSessionQuery()
  const user = data?.authenticated && data && 'user' in data ? (data.user ?? null) : null

  return (
    <Link
      href="/profile"
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full border px-2.5 pr-3 shadow-sm transition-colors',
        active
          ? 'border-primary/25 bg-primary text-primary-foreground shadow-sm'
          : 'border-slate-200/80 bg-white/92 hover:bg-white',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex h-7 w-7 shrink-0 overflow-hidden rounded-full border bg-slate-100',
          active ? 'border-primary-foreground/30' : 'border-white/80',
        )}
      >
        <Image
          src={user?.avatarSrc ?? '/images/assistant-avatar.svg'}
          alt="我的头像"
          width={28}
          height={28}
          unoptimized
          className="h-full w-full object-cover"
        />
      </span>
      <span
        className={cn(
          'max-w-[7rem] truncate text-xs font-bold',
          active ? 'text-primary-foreground' : 'text-foreground/82',
        )}
      >
        {user?.nickname ?? '我的'}
      </span>
    </Link>
  )
}
