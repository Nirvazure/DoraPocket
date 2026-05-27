'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { PocketQuickSettingsFields } from '@/components/pocket/pocket-quick-settings-fields'
import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import type { UserSettings } from '@/shared/user-settings'

type PocketQuickSettingsModalProps = {
  open: boolean
  settings: UserSettings | undefined
  readOnly?: boolean
  onClose: () => void
  onSave: (next: UserSettings) => void
}

export function PocketQuickSettingsModal({
  open,
  settings,
  readOnly = false,
  onClose,
  onSave,
}: PocketQuickSettingsModalProps) {
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <DisplayPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="pocket-quick-settings-title"
        className="max-h-[min(90dvh,calc(100dvh-2rem))] min-h-[22rem] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] bg-white p-4 shadow-2xl sm:p-5"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <DisplayPanelHeader className="p-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Quick Settings
            </p>
            <DisplayPanelTitle id="pocket-quick-settings-title" className="mt-0.5 text-2xl">
              快捷设置
            </DisplayPanelTitle>
            <DisplayPanelDescription className="mt-1 text-sm text-slate-600">
              {readOnly
                ? '登录后才会同步到你的账号。当前只能预览设置。'
                : '调整输入方式、解释风格和语音播报，立刻应用到当前对话。'}
            </DisplayPanelDescription>
          </DisplayPanelHeader>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full text-muted-foreground hover:bg-slate-100 hover:text-foreground"
            onClick={onClose}
            aria-label="关闭设置"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <DisplayPanelContent className="mt-4 p-0">
          <PocketQuickSettingsFields settings={settings} onSave={onSave} readOnly={readOnly} />
        </DisplayPanelContent>
      </DisplayPanel>
    </div>,
    document.body,
  )
}
