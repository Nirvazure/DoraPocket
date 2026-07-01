'use client'

import type { ReactNode } from 'react'
import { Brain, Settings2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UserSettings } from '@/shared/user/user-settings'

type ProfileSettingsPanelProps = {
  settings: UserSettings
  readOnly?: boolean
  onSave: (next: UserSettings) => void
  className?: string
}

export function ProfileSettingsPanel({
  settings,
  readOnly,
  onSave,
  className,
}: ProfileSettingsPanelProps) {
  const patchSettings = (patch: Partial<UserSettings>) => {
    if (readOnly) return
    onSave({ ...settings, ...patch })
  }

  return (
    <section
      className={cn(
        'flex h-full min-h-0 flex-col rounded-[1.8rem] border border-white/80 bg-white/92 p-4 shadow-[0_10px_36px_-14px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-5',
        className,
      )}
    >
      <header>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-sky-600">
          <Settings2 className="h-4 w-4" />
          设置
        </div>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">
          调整 Dora 如何记住你的判断，以及怎么和你说话。
        </p>
      </header>

      {readOnly ? (
        <p className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3.5 py-2.5 text-xs leading-6 text-amber-900">
          正在同步设置，请稍候。
        </p>
      ) : null}

      <div className="mt-5 flex min-h-0 flex-1 flex-col space-y-5 overflow-y-auto [scrollbar-width:thin]">
        <SettingsGroup title="推荐与记忆" icon={<Brain className="h-3.5 w-3.5" />}>
          <ToggleRow
            title="记录历史"
            description="用判断记录帮助后续推荐。"
            checked={settings.memoryEnabled}
            disabled={readOnly}
            onChange={(checked) => patchSettings({ memoryEnabled: checked })}
          />
          <SegmentedRow
            title="解释方式"
            wide
            value={settings.explanationMode}
            disabled={readOnly}
            options={[
              { value: 'brief', label: '直接' },
              { value: 'standard', label: '保留理由' },
            ]}
            onChange={(explanationMode) => patchSettings({ explanationMode })}
          />
        </SettingsGroup>

        <SettingsGroup title="交互偏好" icon={<Sparkles className="h-3.5 w-3.5" />}>
          <ToggleRow
            title="语音播报"
            description="结果出来后用声音补一句。"
            checked={settings.voicePlaybackEnabled}
            disabled={readOnly}
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
            wide
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
        </SettingsGroup>
      </div>
    </section>
  )
}

function SettingsGroup({
  title,
  icon,
  children,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 px-0.5">
        <span className="text-primary/70">{icon}</span>
        <p className="text-[11px] font-bold tracking-wide text-slate-400">{title}</p>
      </div>
      <div className="divide-y divide-slate-100/90 overflow-hidden rounded-[1.15rem] border border-slate-100 bg-slate-50/45">
        {children}
      </div>
    </div>
  )
}

function SettingRow({
  title,
  description,
  control,
  wideControl = false,
}: {
  title: string
  description?: string
  control: ReactNode
  wideControl?: boolean
}) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 sm:gap-2.5 sm:px-3 sm:py-2.5">
      <div
        className={cn(
          'shrink-0',
          wideControl ? 'w-[3.75rem] sm:w-16' : 'w-[4.25rem] sm:w-[4.75rem]',
        )}
      >
        <p className="text-[11px] font-semibold leading-tight text-slate-900 sm:text-xs">{title}</p>
      </div>
      {!wideControl && description ? (
        <div className="min-w-0 flex-1">
          <p className="hidden truncate text-[10px] leading-4 text-slate-500 xl:block">
            {description}
          </p>
        </div>
      ) : null}
      <div className={cn('min-w-0', wideControl ? 'flex-[1.85] basis-0' : 'flex-1')}>{control}</div>
    </div>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <SettingRow
      title={title}
      description={description}
      control={
        <div className="flex justify-end">
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={title}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
              'relative inline-flex h-6 w-10 rounded-full transition-all duration-200 sm:h-7 sm:w-12',
              checked
                ? 'bg-primary shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.55)]'
                : 'bg-slate-200/90',
              disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_4px_rgba(15,23,42,0.18)] transition-transform duration-200 sm:top-1',
                checked
                  ? 'translate-x-[1.15rem] sm:translate-x-[1.35rem]'
                  : 'translate-x-0.5 sm:translate-x-1',
              )}
            />
          </button>
        </div>
      }
    />
  )
}

function SegmentedRow<T extends string>({
  title,
  value,
  options,
  disabled,
  wide,
  onChange,
}: {
  title: string
  value: T
  options: Array<{ value: T; label: string }>
  disabled?: boolean
  wide?: boolean
  onChange: (value: T) => void
}) {
  return (
    <SettingRow
      title={title}
      wideControl={wide}
      control={
        <div
          role="tablist"
          aria-label={title}
          className={cn(
            'flex w-full min-w-0 items-stretch rounded-full border border-white/80 bg-white/70 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]',
            wide ? 'max-w-none' : 'max-w-[11rem] sm:max-w-[12rem]',
          )}
        >
          {options.map((option) => {
            const active = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={disabled}
                onClick={() => onChange(option.value)}
                className={cn(
                  'min-w-0 flex-1 cursor-pointer rounded-full font-bold leading-none transition-[background-color,box-shadow,color] duration-200',
                  wide
                    ? 'px-2 py-2 text-[11px] sm:px-2.5 sm:text-xs'
                    : 'px-1.5 py-1.5 text-[11px] sm:text-xs',
                  active
                    ? 'text-primary-foreground shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.45)]'
                    : 'text-slate-600 hover:bg-white/90 hover:text-slate-900',
                  active &&
                    'bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--dora-blue-deep))_100%)]',
                  disabled && 'cursor-not-allowed opacity-50',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      }
    />
  )
}
