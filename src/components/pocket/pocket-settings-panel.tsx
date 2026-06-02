'use client'

import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import type { UserSettings } from '@/shared/user-settings'

type PocketSettingsPanelProps = {
  settings: UserSettings | undefined
  readOnly?: boolean
  onSave: (next: UserSettings) => void
}

export function PocketSettingsPanel({ readOnly = false }: PocketSettingsPanelProps) {
  return (
    <DisplayPanel className="rounded-[2.4rem] border-white/90 bg-white shadow-[0_28px_86px_rgba(14,165,233,0.08)]">
      <DisplayPanelContent className="p-6 sm:p-7">
        <DisplayPanelHeader className="p-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Pocket Settings
          </p>
          <DisplayPanelTitle className="mt-1 text-2xl">口袋设置</DisplayPanelTitle>
          <DisplayPanelDescription className="mt-2 text-sm text-slate-600">
            输入方式、解释风格和语音播报可在首页 Dora 面板右上角快捷设置。
          </DisplayPanelDescription>
        </DisplayPanelHeader>

        {readOnly ? (
          <p className="mt-5 rounded-2xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            登录后才会同步到你的账号。当前只能预览设置。
          </p>
        ) : null}
      </DisplayPanelContent>
    </DisplayPanel>
  )
}
