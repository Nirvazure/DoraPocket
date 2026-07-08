import type { UserSettings } from '@/shared/user/user-settings'

export function applyUserSettingsToDocument(settings: Pick<UserSettings, 'fontPreset'>) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.fontPreset = settings.fontPreset
}
