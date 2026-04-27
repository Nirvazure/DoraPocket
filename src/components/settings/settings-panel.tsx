'use client'

import { RotateCcw, Settings2, Sparkles, Trash2, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { FontPreset, UserSettings } from '@/services/user-settings'
import { SETTINGS_COPY } from '@/shared/ui-copy'

type SettingsPanelProps = {
  settings: UserSettings
  onSave: (next: UserSettings) => void
  onResetPreferenceProfile: () => void
  onClearChatHistory: () => void
  resetPreferencePending?: boolean
  clearHistoryPending?: boolean
}

type SettingSectionProps = {
  icon: typeof Volume2
  title: string
  description: string
  children: React.ReactNode
}

type ToggleRowProps = {
  title: string
  description: string
  value: boolean
  onChange: (next: boolean) => void
}

type Option<T extends string> = {
  value: T
  label: string
}

type ChoiceRowProps<T extends string> = {
  title: string
  description: string
  value: T
  options: readonly Option<T>[]
  onChange: (next: T) => void
}

function SettingSection({ icon: Icon, title, description, children }: SettingSectionProps) {
  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white/92 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-black text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

function ToggleRow({ title, description, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] px-4 py-3 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm font-black text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        aria-pressed={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative inline-flex h-8 w-[3.3rem] shrink-0 items-center rounded-full border transition-colors',
          value ? 'border-primary/20 bg-primary' : 'border-border/70 bg-slate-200',
        )}
      >
        <span
          className={cn(
            'inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform',
            value ? 'translate-x-[1.45rem]' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  )
}

function ChoiceRow<T extends string>({
  title,
  description,
  value,
  options,
  onChange,
}: ChoiceRowProps<T>) {
  return (
    <div className="rounded-[1.4rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] px-4 py-3 shadow-sm">
      <p className="text-sm font-black text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-sm transition-colors',
                active
                  ? 'border-primary/15 bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(37,99,235,0.18)]'
                  : 'border-border/70 bg-white text-foreground/75 hover:bg-slate-50',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SettingsPanel({
  settings,
  onSave,
  onResetPreferenceProfile,
  onClearChatHistory,
  resetPreferencePending = false,
  clearHistoryPending = false,
}: SettingsPanelProps) {
  const patchSettings = (patch: Partial<UserSettings>) => {
    onSave({ ...settings, ...patch })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="space-y-4">
        <SettingSection
          icon={Volume2}
          title={SETTINGS_COPY.sections.companion.title}
          description={SETTINGS_COPY.sections.companion.description}
        >
          <ToggleRow
            title={SETTINGS_COPY.items.voicePlayback.title}
            description={SETTINGS_COPY.items.voicePlayback.description}
            value={settings.voicePlaybackEnabled}
            onChange={(next) =>
              patchSettings({
                voicePlaybackEnabled: next,
                voicePlaybackMode: next ? settings.voicePlaybackMode : 'off',
              })
            }
          />
          <ChoiceRow
            title={SETTINGS_COPY.items.voicePlaybackMode.title}
            description={SETTINGS_COPY.items.voicePlaybackMode.description}
            value={settings.voicePlaybackMode}
            options={SETTINGS_COPY.items.voicePlaybackMode.options}
            onChange={(next) =>
              patchSettings({
                voicePlaybackMode: next,
                voicePlaybackEnabled: next !== 'off',
              })
            }
          />
          <ToggleRow
            title={SETTINGS_COPY.items.soundEffects.title}
            description={SETTINGS_COPY.items.soundEffects.description}
            value={settings.soundEffectsEnabled}
            onChange={(next) => patchSettings({ soundEffectsEnabled: next })}
          />
          <ChoiceRow
            title={SETTINGS_COPY.items.defaultInputMode.title}
            description={SETTINGS_COPY.items.defaultInputMode.description}
            value={settings.defaultInputMode}
            options={SETTINGS_COPY.items.defaultInputMode.options}
            onChange={(next) => patchSettings({ defaultInputMode: next })}
          />
        </SettingSection>

        <SettingSection
          icon={Sparkles}
          title={SETTINGS_COPY.sections.memory.title}
          description={SETTINGS_COPY.sections.memory.description}
        >
          <ToggleRow
            title={SETTINGS_COPY.items.autoSave.title}
            description={SETTINGS_COPY.items.autoSave.description}
            value={settings.autoSaveToPocketEnabled}
            onChange={(next) => patchSettings({ autoSaveToPocketEnabled: next })}
          />
          <ToggleRow
            title={SETTINGS_COPY.items.memory.title}
            description={SETTINGS_COPY.items.memory.description}
            value={settings.memoryEnabled}
            onChange={(next) => patchSettings({ memoryEnabled: next })}
          />
        </SettingSection>
      </div>

      <div className="space-y-4">
        <SettingSection
          icon={Settings2}
          title={SETTINGS_COPY.sections.presentation.title}
          description={SETTINGS_COPY.sections.presentation.description}
        >
          <ChoiceRow
            title={SETTINGS_COPY.items.explanationMode.title}
            description={SETTINGS_COPY.items.explanationMode.description}
            value={settings.explanationMode}
            options={SETTINGS_COPY.items.explanationMode.options}
            onChange={(next) => patchSettings({ explanationMode: next })}
          />
          <ChoiceRow<FontPreset>
            title={SETTINGS_COPY.items.fontPreset.title}
            description={SETTINGS_COPY.items.fontPreset.description}
            value={settings.fontPreset}
            options={SETTINGS_COPY.items.fontPreset.options}
            onChange={(next) => patchSettings({ fontPreset: next })}
          />
        </SettingSection>

        <SettingSection
          icon={RotateCcw}
          title={SETTINGS_COPY.sections.reset.title}
          description={SETTINGS_COPY.sections.reset.description}
        >
          <div className="rounded-[1.4rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] px-4 py-3 shadow-sm">
            <p className="text-sm font-black text-foreground">
              {SETTINGS_COPY.actions.resetPreferenceTitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {SETTINGS_COPY.actions.resetPreferenceDescription}
            </p>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-full bg-white"
                onClick={onResetPreferenceProfile}
                disabled={resetPreferencePending}
              >
                <RotateCcw className="h-4 w-4" />
                {SETTINGS_COPY.actions.resetPreferenceAction}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="rounded-[1.4rem] border border-destructive/20 bg-[linear-gradient(180deg,rgba(255,247,247,0.98),rgba(255,255,255,0.98))] px-4 py-3 shadow-sm">
            <p className="text-sm font-black text-foreground">
              {SETTINGS_COPY.actions.clearHistoryTitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {SETTINGS_COPY.actions.clearHistoryDescription}
            </p>
            <div className="mt-3">
              <Button
                type="button"
                variant="destructive"
                className="rounded-full"
                onClick={onClearChatHistory}
                disabled={clearHistoryPending}
              >
                <Trash2 className="h-4 w-4" />
                {SETTINGS_COPY.actions.clearHistoryAction}
              </Button>
            </div>
          </div>
        </SettingSection>
      </div>
    </div>
  )
}
