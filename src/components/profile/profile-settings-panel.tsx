'use client'

import { Settings2, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserSettings } from '@/shared/user-settings'

type ProfileSettingsPanelProps = {
  settings: UserSettings
  readOnly?: boolean
  onSave: (next: UserSettings) => void
}

export function ProfileSettingsPanel({ settings, readOnly, onSave }: ProfileSettingsPanelProps) {
  const patchSettings = (patch: Partial<UserSettings>) => {
    if (readOnly) return
    onSave({ ...settings, ...patch })
  }

  return (
    <aside className="space-y-3">
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-sky-600">
          <Settings2 className="h-4 w-4" />
          设置
        </div>
        {readOnly ? (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-900">
            正在同步设置，请稍候。
          </p>
        ) : null}

        <div className="mt-4 space-y-3">
          <ToggleRow
            title="记录历史"
            description="用判断记录帮助后续推荐。"
            checked={settings.memoryEnabled}
            disabled={readOnly}
            onChange={(checked) => patchSettings({ memoryEnabled: checked })}
          />
          <SegmentedRow
            title="解释"
            value={settings.explanationMode}
            disabled={readOnly}
            options={[
              { value: 'brief', label: '直接' },
              { value: 'standard', label: '保留理由' },
            ]}
            onChange={(explanationMode) => patchSettings({ explanationMode })}
          />
          <ToggleRow
            title="语音播报"
            description="结果出来后用声音补一句。"
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
      </section>
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
    <div className="flex items-center gap-3 rounded-[1rem] border border-slate-200 px-3 py-2.5">
      {icon ? <span className="text-sky-600">{icon}</span> : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-10 rounded-full transition-colors',
          checked ? 'bg-sky-500' : 'bg-slate-200',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-5' : 'translate-x-1',
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
    <div className="rounded-[1rem] border border-slate-200 px-3 py-2.5">
      <p className="text-sm font-bold text-slate-900">{title}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs font-bold transition-colors',
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
