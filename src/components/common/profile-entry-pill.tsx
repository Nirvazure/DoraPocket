'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { loadUserProfile, subscribeUserProfile, type UserProfile } from '@/services/user-profile'

type ProfileEntryPillProps = {
  active?: boolean
  className?: string
}

export function ProfileEntryPill({ active = false, className }: ProfileEntryPillProps) {
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile())

  useEffect(() => {
    return subscribeUserProfile(setProfile)
  }, [])

  return (
    <Link
      href="/profile"
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full border px-2.5 pr-3 shadow-sm transition-colors',
        active ? 'border-primary/25 bg-primary text-primary-foreground shadow-sm' : 'border-slate-200/80 bg-white/92 hover:bg-white',
        className,
      )}
    >
      <span className={cn('inline-flex h-7 w-7 shrink-0 overflow-hidden rounded-full border bg-slate-100', active ? 'border-primary-foreground/30' : 'border-white/80')}>
        <Image src={profile.avatarSrc ?? '/branding/assistant-avatar.svg'} alt="个人头像" width={28} height={28} unoptimized className="h-full w-full object-cover" />
      </span>
      <span className={cn('max-w-24 truncate text-xs font-bold', active ? 'text-primary-foreground' : 'text-foreground/82')}>{profile.nickname}</span>
    </Link>
  )
}
