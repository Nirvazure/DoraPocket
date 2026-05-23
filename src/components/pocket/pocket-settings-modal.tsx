'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import type { UserSettings } from '@/services/user-settings'

type PocketSettingsModalProps = {
  open: boolean
  settings: UserSettings | undefined
  onClose: () => void
  onSave: (next: UserSettings) => void
}

function updateSettings(
  current: UserSettings | undefined,
  patch: Partial<UserSettings>,
  save: (next: UserSettings) => void,
) {
  if (!current) return
  save({ ...current, ...patch })
}

export function PocketSettingsModal({ open, settings, onClose, onSave }: PocketSettingsModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <DisplayPanel className="w-full max-w-2xl rounded-[2rem] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <DisplayPanelHeader className="p-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              Pocket Settings
            </p>
            <DisplayPanelTitle className="mt-1 text-2xl">口袋设置</DisplayPanelTitle>
            <DisplayPanelDescription className="mt-2 text-sm text-slate-600">
              控制 DoraPocket 怎么陪你、怎么解释，以及什么时候先把工具收入口袋。
            </DisplayPanelDescription>
          </DisplayPanelHeader>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:bg-slate-100 hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <DisplayPanelContent className="mt-5 grid gap-3 p-0 md:grid-cols-2">
          <DisplayPanel className="rounded-[1.5rem] border-white/90 bg-slate-50/80 shadow-none">
            <DisplayPanelContent className="space-y-3 p-5">
              <p className="text-sm font-black text-slate-950">默认输入方式</p>
              <div className="flex gap-2">
                {(['text', 'voice'] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={settings?.defaultInputMode === mode ? 'default' : 'outline'}
                    className="rounded-full px-4 text-xs font-bold"
                    onClick={() => updateSettings(settings, { defaultInputMode: mode }, onSave)}
                  >
                    {mode === 'text' ? '文字' : '语音'}
                  </Button>
                ))}
              </div>
            </DisplayPanelContent>
          </DisplayPanel>

          <DisplayPanel className="rounded-[1.5rem] border-white/90 bg-slate-50/80 shadow-none">
            <DisplayPanelContent className="space-y-3 p-5">
              <p className="text-sm font-black text-slate-950">解释详细度</p>
              <div className="flex gap-2">
                {(
                  [
                    { value: 'brief', label: '更直接' },
                    { value: 'standard', label: '保留理由' },
                  ] as const
                ).map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    variant={settings?.explanationMode === item.value ? 'default' : 'outline'}
                    className="rounded-full px-4 text-xs font-bold"
                    onClick={() =>
                      updateSettings(settings, { explanationMode: item.value }, onSave)
                    }
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </DisplayPanelContent>
          </DisplayPanel>

          <DisplayPanel className="rounded-[1.5rem] border-white/90 bg-slate-50/80 shadow-none">
            <DisplayPanelContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">自动收进口袋</p>
                  <p className="text-xs text-slate-600">值得以后再用时，先替你收好。</p>
                </div>
                <Button
                  type="button"
                  variant={settings?.autoSaveToPocketEnabled ? 'default' : 'outline'}
                  className="rounded-full px-4 text-xs font-bold"
                  onClick={() =>
                    updateSettings(
                      settings,
                      { autoSaveToPocketEnabled: !settings?.autoSaveToPocketEnabled },
                      onSave,
                    )
                  }
                >
                  {settings?.autoSaveToPocketEnabled ? '已开启' : '已关闭'}
                </Button>
              </div>
            </DisplayPanelContent>
          </DisplayPanel>

          <DisplayPanel className="rounded-[1.5rem] border-white/90 bg-slate-50/80 shadow-none">
            <DisplayPanelContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">语音播报</p>
                  <p className="text-xs text-slate-600">结果出来后，是否用语音补一句。</p>
                </div>
                <Button
                  type="button"
                  variant={settings?.voicePlaybackEnabled ? 'default' : 'outline'}
                  className="rounded-full px-4 text-xs font-bold"
                  onClick={() =>
                    updateSettings(
                      settings,
                      { voicePlaybackEnabled: !settings?.voicePlaybackEnabled },
                      onSave,
                    )
                  }
                >
                  {settings?.voicePlaybackEnabled ? '已开启' : '已关闭'}
                </Button>
              </div>
            </DisplayPanelContent>
          </DisplayPanel>

          <DisplayPanel className="rounded-[1.5rem] border-white/90 bg-slate-50/80 shadow-none md:col-span-2">
            <DisplayPanelContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">内置道具开关</p>
                  <p className="text-xs text-slate-600">
                    关闭后，系统会把内置道具视为不存在，不展示、不推荐，也不允许使用。
                  </p>
                </div>
                <Button
                  type="button"
                  variant={settings?.builtinToolsEnabled ? 'default' : 'outline'}
                  className="rounded-full px-4 text-xs font-bold"
                  onClick={() =>
                    updateSettings(
                      settings,
                      { builtinToolsEnabled: !settings?.builtinToolsEnabled },
                      onSave,
                    )
                  }
                >
                  {settings?.builtinToolsEnabled ? '已开启' : '已关闭'}
                </Button>
              </div>
            </DisplayPanelContent>
          </DisplayPanel>
        </DisplayPanelContent>
      </DisplayPanel>
    </div>
  )
}
