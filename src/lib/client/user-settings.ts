// Legacy local storage bridge. Cloud settings are now served via /api/me/settings.
import { readStorageJson, writeStorageJson } from '@/lib/storage'
import {
  getDefaultUserSettings,
  type ExplanationMode,
  type FontPreset,
  type InputModePreference,
  type UserSettings,
  type VoicePlaybackMode,
} from '@/shared/user-settings'

export const USER_SETTINGS_STORAGE_KEY = 'dp-user-settings-v1'
export const USER_SETTINGS_UPDATED_EVENT = 'dp-user-settings-updated'
export const LEGACY_FONT_PRESET_STORAGE_KEY = 'dorapocket-font-preset'

function resolveLegacyFontPreset(): FontPreset {
  if (typeof window === 'undefined') return 'c'
  try {
    const value = window.localStorage.getItem(LEGACY_FONT_PRESET_STORAGE_KEY)
    return normalizeFontPreset(value)
  } catch {
    return 'c'
  }
}

function normalizeVoicePlaybackMode(value: unknown): VoicePlaybackMode {
  return value === 'off' || value === 'full' || value === 'key-result' ? value : 'key-result'
}

function normalizeInputMode(value: unknown): InputModePreference {
  return value === 'voice' ? 'voice' : 'text'
}

function normalizeExplanationMode(value: unknown): ExplanationMode {
  return value === 'brief' ? 'brief' : 'standard'
}

function normalizeFontPreset(value: unknown): FontPreset {
  return value === 'a' || value === 'b' || value === 'c' || value === 'd' ? value : 'c'
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

export function loadUserSettings(): UserSettings {
  const defaults = getDefaultUserSettings()
  const parsed = readStorageJson<unknown>(USER_SETTINGS_STORAGE_KEY, null)
  if (!parsed || typeof parsed !== 'object') {
    return {
      ...defaults,
      fontPreset: resolveLegacyFontPreset(),
    }
  }

  const raw = parsed as Partial<UserSettings>
  return {
    voicePlaybackEnabled: normalizeBoolean(raw.voicePlaybackEnabled, defaults.voicePlaybackEnabled),
    voicePlaybackMode: normalizeVoicePlaybackMode(raw.voicePlaybackMode),
    soundEffectsEnabled: normalizeBoolean(raw.soundEffectsEnabled, defaults.soundEffectsEnabled),
    defaultInputMode: normalizeInputMode(raw.defaultInputMode),
    memoryEnabled: normalizeBoolean(raw.memoryEnabled, defaults.memoryEnabled),
    builtinToolsEnabled: normalizeBoolean(raw.builtinToolsEnabled, defaults.builtinToolsEnabled),
    explanationMode: normalizeExplanationMode(raw.explanationMode),
    fontPreset: normalizeFontPreset(raw.fontPreset ?? resolveLegacyFontPreset()),
  }
}

export function applyUserSettingsToDocument(settings: Pick<UserSettings, 'fontPreset'>) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.fontPreset = settings.fontPreset
}

export function saveUserSettings(settings: UserSettings): UserSettings {
  const next = {
    voicePlaybackEnabled: Boolean(settings.voicePlaybackEnabled),
    voicePlaybackMode: normalizeVoicePlaybackMode(settings.voicePlaybackMode),
    soundEffectsEnabled: Boolean(settings.soundEffectsEnabled),
    defaultInputMode: normalizeInputMode(settings.defaultInputMode),
    memoryEnabled: Boolean(settings.memoryEnabled),
    builtinToolsEnabled: Boolean(settings.builtinToolsEnabled),
    explanationMode: normalizeExplanationMode(settings.explanationMode),
    fontPreset: normalizeFontPreset(settings.fontPreset),
  } satisfies UserSettings

  writeStorageJson(USER_SETTINGS_STORAGE_KEY, next)
  applyUserSettingsToDocument(next)

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LEGACY_FONT_PRESET_STORAGE_KEY, next.fontPreset)
    } catch {
      /* ignore */
    }

    window.dispatchEvent(
      new CustomEvent<UserSettings>(USER_SETTINGS_UPDATED_EVENT, { detail: next }),
    )
  }

  return next
}

export function subscribeUserSettings(listener: (settings: UserSettings) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const emitLatest = () => {
    const next = loadUserSettings()
    applyUserSettingsToDocument(next)
    listener(next)
  }

  const handleCustomUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<UserSettings>
    const next = customEvent.detail ?? loadUserSettings()
    applyUserSettingsToDocument(next)
    listener(next)
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== USER_SETTINGS_STORAGE_KEY && event.key !== LEGACY_FONT_PRESET_STORAGE_KEY) {
      return
    }

    emitLatest()
  }

  window.addEventListener(USER_SETTINGS_UPDATED_EVENT, handleCustomUpdate)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(USER_SETTINGS_UPDATED_EVENT, handleCustomUpdate)
    window.removeEventListener('storage', handleStorage)
  }
}
