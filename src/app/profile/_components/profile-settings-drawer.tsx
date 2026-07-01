'use client'

import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'dorapocket.profile-settings-drawer'

export const PROFILE_WORKSPACE_HEIGHT_CLASS =
  'xl:min-h-[calc(100dvh-7.75rem)] xl:h-[calc(100dvh-7.75rem)]'

function readDrawerOpenState(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(STORAGE_KEY) !== 'closed'
}

type ProfileSettingsDrawerProps = {
  children: ReactNode
}

export function ProfileSettingsDrawer({ children }: ProfileSettingsDrawerProps) {
  const [open, setOpen] = useState(readDrawerOpenState)

  const setDrawerOpen = (next: boolean) => {
    setOpen(next)
    window.localStorage.setItem(STORAGE_KEY, next ? 'open' : 'closed')
  }

  return (
    <>
      <div className="min-w-0 xl:hidden">{children}</div>

      <aside
        className={cn(
          'relative hidden min-h-0 shrink-0 transition-[width] duration-300 ease-out xl:flex',
          open ? 'w-[400px]' : 'w-0 overflow-visible',
        )}
      >
        {open ? (
          <div
            className={cn(
              'relative flex min-h-0 w-full flex-col pl-2',
              PROFILE_WORKSPACE_HEIGHT_CLASS,
            )}
          >
            <button
              type="button"
              aria-label="收起设置"
              aria-expanded
              onClick={() => setDrawerOpen(false)}
              className="absolute -left-3.5 top-8 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full border border-white/90 bg-white text-slate-600 shadow-[0_8px_24px_-10px_rgba(15,23,42,0.22)] transition-colors hover:border-sky-200 hover:text-sky-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="min-h-0 flex-1">{children}</div>
          </div>
        ) : (
          <button
            type="button"
            aria-label="展开设置"
            aria-expanded={false}
            onClick={() => setDrawerOpen(true)}
            className="group pointer-events-auto absolute right-0 top-1/2 z-10 flex h-auto w-12 -translate-y-1/2 cursor-pointer flex-col items-center gap-2 rounded-[1.15rem] border border-white/85 bg-[linear-gradient(165deg,hsl(0_0%_100%/0.96)_0%,hsl(199_45%_99%/0.9)_100%)] px-2 py-3 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)] backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-200 hover:-translate-x-0.5 hover:-translate-y-1/2 hover:border-sky-200/80 hover:shadow-[0_14px_36px_-10px_hsl(var(--primary)/0.22)]"
          >
            <span className="flex size-8 items-center justify-center rounded-full border border-white/90 bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--dora-blue-deep))_100%)] text-primary-foreground shadow-[0_6px_16px_-6px_hsl(var(--primary)/0.45)]">
              <Settings2 className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-bold leading-none tracking-wide text-slate-600 group-hover:text-sky-700">
              设置
            </span>
            <ChevronLeft className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-sky-600" />
          </button>
        )}
      </aside>
    </>
  )
}
