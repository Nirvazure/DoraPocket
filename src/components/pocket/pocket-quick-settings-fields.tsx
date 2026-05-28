'use client'

import { SegmentedSettingControl, SettingRow } from '@/components/pocket/setting-controls'
import { Switch } from '@/components/ui/switch'
import type { UserSettings } from '@/shared/user-settings'

type PocketQuickSettingsFieldsProps = {
  settings: UserSettings | undefined
  onSave: (next: UserSettings) => void
  readOnly?: boolean
}

export function patchUserSettings(
  current: UserSettings | undefined,
  patch: Partial<UserSettings>,
  save: (next: UserSettings) => void,
  readOnly = false,
) {
  if (readOnly || !current) return
  save({ ...current, ...patch })
}

function SettingsLoginBanner() {
  return (
    <p className="rounded-2xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
      登录后才会同步到你的账号。当前只能预览设置。
    </p>
  )
}

export function PocketQuickSettingsFields({
  settings,
  onSave,
  readOnly = false,
}: PocketQuickSettingsFieldsProps) {
  const update = (patch: Partial<UserSettings>) =>
    patchUserSettings(settings, patch, onSave, readOnly)
  const inputMode = settings?.defaultInputMode ?? 'text'
  const explanationMode = settings?.explanationMode ?? 'standard'

  const rowClassName = 'gap-4 px-3 py-3'

  return (
    <div className="space-y-2.5">
      {readOnly ? <SettingsLoginBanner /> : null}
      <SettingRow label="默认输入方式" className={rowClassName}>
        <SegmentedSettingControl
          size="lg"
          value={inputMode}
          disabled={readOnly}
          options={[
            { value: 'text', label: '文字' },
            { value: 'voice', label: '语音' },
          ]}
          onChange={(value) => update({ defaultInputMode: value })}
        />
      </SettingRow>

      <SettingRow label="解释详细度" className={rowClassName}>
        <SegmentedSettingControl
          size="lg"
          value={explanationMode}
          disabled={readOnly}
          options={[
            { value: 'brief', label: '更直接' },
            { value: 'standard', label: '保留理由' },
          ]}
          onChange={(value) => update({ explanationMode: value })}
        />
      </SettingRow>

      <SettingRow
        label="语音播报"
        description="结果出来后朗读关键结论；长回答不会整段播报。"
        className={rowClassName}
      >
        <Switch
          size="lg"
          disabled={readOnly}
          checked={settings?.voicePlaybackEnabled !== false}
          onCheckedChange={(checked) =>
            update({
              voicePlaybackEnabled: checked,
              ...(checked && settings?.voicePlaybackMode === 'off'
                ? { voicePlaybackMode: 'key-result' }
                : {}),
            })
          }
          aria-label="语音播报"
        />
      </SettingRow>
    </div>
  )
}
