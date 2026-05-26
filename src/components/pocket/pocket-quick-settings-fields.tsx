'use client'

import { SegmentedSettingControl, SettingRow } from '@/components/pocket/setting-controls'
import { Switch } from '@/components/ui/switch'
import type { UserSettings } from '@/shared/user-settings'

type PocketQuickSettingsFieldsProps = {
  settings: UserSettings | undefined
  onSave: (next: UserSettings) => void
}

export function patchUserSettings(
  current: UserSettings | undefined,
  patch: Partial<UserSettings>,
  save: (next: UserSettings) => void,
) {
  if (!current) return
  save({ ...current, ...patch })
}

export function PocketQuickSettingsFields({ settings, onSave }: PocketQuickSettingsFieldsProps) {
  const update = (patch: Partial<UserSettings>) => patchUserSettings(settings, patch, onSave)
  const inputMode = settings?.defaultInputMode ?? 'text'
  const explanationMode = settings?.explanationMode ?? 'standard'

  const rowClassName = 'gap-4 px-3 py-3'

  return (
    <div className="space-y-2.5">
      <SettingRow label="默认输入方式" className={rowClassName}>
        <SegmentedSettingControl
          size="lg"
          value={inputMode}
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
