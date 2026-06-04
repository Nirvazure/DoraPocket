'use client'

import { Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppState } from '@/store'

type StageVoiceFabProps = {
  appState: AppState
  disabled?: boolean
  onHoldToTalkStart: () => void
  onHoldToTalkEnd: () => void
  onHoldToTalkCancel?: () => void
}

export function StageVoiceFab({
  appState,
  disabled = false,
  onHoldToTalkStart,
  onHoldToTalkEnd,
  onHoldToTalkCancel,
}: StageVoiceFabProps) {
  const listening = appState === 'listening'
  const locked = disabled || appState === 'thinking' || appState === 'speaking'

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <button
        type="button"
        disabled={locked}
        aria-label={listening ? '松开结束录音' : '按住说话'}
        title={listening ? '松开结束' : '按住说话'}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-lg transition-colors',
          listening
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-white/90 bg-white/95 text-foreground hover:bg-white',
          locked && 'cursor-not-allowed opacity-45',
        )}
        onPointerDown={() => {
          if (locked) return
          onHoldToTalkStart()
        }}
        onPointerUp={onHoldToTalkEnd}
        onPointerLeave={onHoldToTalkEnd}
        onPointerCancel={() => {
          onHoldToTalkCancel?.()
          onHoldToTalkEnd()
        }}
      >
        <Mic className="h-6 w-6" aria-hidden />
      </button>
    </div>
  )
}
