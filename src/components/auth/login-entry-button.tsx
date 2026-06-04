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
      className={cn('dp-top-profile-pill', active && 'dp-top-profile-pill-active', className)}
    >
      <span className={cn('dp-top-profile-avatar', active && 'border-primary-foreground/30')}>
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
          active ? 'text-primary-foreground' : 'text-slate-800',
        )}
      >
        {user?.nickname ?? '我的'}
      </span>
    </Link>
  )
}
