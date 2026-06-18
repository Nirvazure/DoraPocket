'use client'

import { LogIn, LogOut, Settings2, Volume2 } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UserSettings } from '@/shared/user-settings'

type ProfileSettingsPanelProps = {
  settings: UserSettings
  readOnly?: boolean
  isAuthenticated: boolean
  onSave: (next: UserSettings) => void
}

export function ProfileSettingsPanel({
  settings,
  readOnly,
  isAuthenticated,
  onSave,
}: ProfileSettingsPanelProps) {
  const patchSettings = (patch: Partial<UserSettings>) => {
    if (readOnly) return
    onSave({ ...settings, ...patch })
  }

  return (
    <aside className="space-y-4">
      <div className="rounded-[2rem] border border-white/90 bg-white p-5 shadow-[0_28px_86px_rgba(14,165,233,0.06)]">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-sky-600">
          <Settings2 className="h-4 w-4" />
          Dora 怎么陪你
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          控制 Dora 如何记住历史、解释结果和使用声音。
        </p>

        {readOnly ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-900">
            登录后才会同步到你的账号。当前只能预览设置。
          </p>
        ) : null}

        <div className="mt-5 space-y-4">
          <ToggleRow
            title="记录历史帮助推荐"
            description="允许 Dora 使用判断记录形成任务记忆。"
            checked={settings.memoryEnabled}
            disabled={readOnly}
            onChange={(checked) => patchSettings({ memoryEnabled: checked })}
          />
          <SegmentedRow
            title="解释详细度"
            value={settings.explanationMode}
            disabled={readOnly}
            options={[
              { value: 'brief', label: '更直接' },
              { value: 'standard', label: '保留理由' },
            ]}
            onChange={(explanationMode) => patchSettings({ explanationMode })}
          />
          <ToggleRow
            title="语音播报"
            description="结果出来后，用声音补一句。"
            checked={settings.voicePlaybackEnabled}
            disabled={readOnly}
            icon={<Volume2 className="h-4 w-4" />}
            onChange={(checked) => patchSettings({ voicePlaybackEnabled: checked })}
          />
          <SegmentedRow
            title="默认输入"
            value={settings.defaultInputMode}
            disabled={readOnly}
            options={[
              { value: 'text', label: '文字' },
              { value: 'voice', label: '语音' },
            ]}
            onChange={(defaultInputMode) => patchSettings({ defaultInputMode })}
          />
          <SegmentedRow
            title="阅读风格"
            value={settings.fontPreset}
            disabled={readOnly}
            options={[
              { value: 'a', label: '稳重' },
              { value: 'b', label: '利落' },
              { value: 'c', label: '轻快' },
              { value: 'd', label: '圆润' },
            ]}
            onChange={(fontPreset) => patchSettings({ fontPreset })}
          />
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/90 bg-white p-5 shadow-sm">
        <p className="text-sm font-black text-slate-950">账号</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {isAuthenticated ? '任务记忆和设置会同步到当前账号。' : '登录后才能同步任务记忆和设置。'}
        </p>
        {!isAuthenticated ? (
          <a
            href="/login"
            className={cn(buttonVariants({ variant: 'default' }), 'mt-4 w-full rounded-full')}
          >
            <LogIn className="h-4 w-4" />
            去登录
          </a>
        ) : (
          <a
            href="/api/auth/logout"
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-4 w-full rounded-full')}
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </a>
        )}
      </div>
    </aside>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  icon,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  icon?: React.ReactNode
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1.2rem] border border-slate-200 px-3 py-3">
      {icon ? <span className="text-sky-600">{icon}</span> : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 rounded-full transition-colors',
          checked ? 'bg-sky-500' : 'bg-slate-200',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}

function SegmentedRow<T extends string>({
  title,
  value,
  options,
  disabled,
  onChange,
}: {
  title: string
  value: T
  options: Array<{ value: T; label: string }>
  disabled?: boolean
  onChange: (value: T) => void
}) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 px-3 py-3">
      <p className="text-sm font-black text-slate-900">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-black transition-colors',
              value === option.value
                ? 'border-sky-300 bg-sky-500 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-sky-50',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
