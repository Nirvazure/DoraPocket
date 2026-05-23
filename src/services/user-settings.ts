// Legacy local storage bridge. Cloud settings are now served via /api/me/settings.
import { readStorageJson, writeStorageJson } from '@/lib/storage'

export const USER_SETTINGS_STORAGE_KEY = 'dp-user-settings-v1'
export const USER_SETTINGS_UPDATED_EVENT = 'dp-user-settings-updated'
export const LEGACY_AUTO_SAVE_STORAGE_KEY = 'dp-pocket-autosave-enabled-v1'
export const LEGACY_FONT_PRESET_STORAGE_KEY = 'dorapocket-font-preset'

export type VoicePlaybackMode = 'off' | 'key-result' | 'full'
export type InputModePreference = 'text' | 'voice'
export type ExplanationMode = 'brief' | 'standard'
export type FontPreset = 'a' | 'b' | 'c' | 'd'

export type UserSettings = {
  voicePlaybackEnabled: boolean
  voicePlaybackMode: VoicePlaybackMode
  soundEffectsEnabled: boolean
  defaultInputMode: InputModePreference
  autoSaveToPocketEnabled: boolean
  memoryEnabled: boolean
  builtinToolsEnabled: boolean
  explanationMode: ExplanationMode
  fontPreset: FontPreset
}

function resolveLegacyAutoSaveValue(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(LEGACY_AUTO_SAVE_STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

function resolveLegacyFontPreset(): FontPreset {
  if (typeof window === 'undefined') return 'c'
  try {
    const value = window.localStorage.getItem(LEGACY_FONT_PRESET_STORAGE_KEY)
    return normalizeFontPreset(value)
  } catch {
    return 'c'
  }
}

export function getDefaultUserSettings(): UserSettings {
  return {
    voicePlaybackEnabled: true,
    voicePlaybackMode: 'key-result',
    soundEffectsEnabled: true,
    defaultInputMode: 'text',
    autoSaveToPocketEnabled: true,
    memoryEnabled: true,
    builtinToolsEnabled: false,
    explanationMode: 'standard',
    fontPreset: 'c',
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
      autoSaveToPocketEnabled: resolveLegacyAutoSaveValue(),
      fontPreset: resolveLegacyFontPreset(),
    }
  }

  const raw = parsed as Partial<UserSettings>
  return {
    voicePlaybackEnabled: normalizeBoolean(raw.voicePlaybackEnabled, defaults.voicePlaybackEnabled),
    voicePlaybackMode: normalizeVoicePlaybackMode(raw.voicePlaybackMode),
    soundEffectsEnabled: normalizeBoolean(raw.soundEffectsEnabled, defaults.soundEffectsEnabled),
    defaultInputMode: normalizeInputMode(raw.defaultInputMode),
    autoSaveToPocketEnabled: normalizeBoolean(
      raw.autoSaveToPocketEnabled,
      resolveLegacyAutoSaveValue(),
    ),
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
    autoSaveToPocketEnabled: Boolean(settings.autoSaveToPocketEnabled),
    memoryEnabled: Boolean(settings.memoryEnabled),
    builtinToolsEnabled: Boolean(settings.builtinToolsEnabled),
    explanationMode: normalizeExplanationMode(settings.explanationMode),
    fontPreset: normalizeFontPreset(settings.fontPreset),
  } satisfies UserSettings

  writeStorageJson(USER_SETTINGS_STORAGE_KEY, next)
  applyUserSettingsToDocument(next)

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        LEGACY_AUTO_SAVE_STORAGE_KEY,
        next.autoSaveToPocketEnabled ? '1' : '0',
      )
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
    if (
      event.key !== USER_SETTINGS_STORAGE_KEY &&
      event.key !== LEGACY_AUTO_SAVE_STORAGE_KEY &&
      event.key !== LEGACY_FONT_PRESET_STORAGE_KEY
    ) {
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
