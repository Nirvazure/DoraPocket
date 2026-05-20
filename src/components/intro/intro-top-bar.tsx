'use client'

import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'

export function IntroTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/68 backdrop-blur-2xl">
      <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-6 lg:px-8">
        <UnifiedTopBar
          title="DoraPocket"
          subtitle="你说任务，DoraPocket 先替你挑工具。"
          rightSlot={
            <div className="flex items-center gap-1.5">
              <TopNavSwitch current="intro" />
              <ProfileEntryPill />
            </div>
          }
        />
      </div>
    </header>
  )
}
