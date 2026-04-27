'use client'

import { LoginEntryButton } from '@/components/auth/login-entry-button'

type ProfileEntryPillProps = {
  active?: boolean
  className?: string
}

export function ProfileEntryPill({ active = false, className }: ProfileEntryPillProps) {
  return <LoginEntryButton active={active} className={className} />
}
