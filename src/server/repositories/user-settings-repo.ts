import 'server-only'

import { prisma } from '@/server/db/prisma'
import { getDefaultUserSettings, type UserSettings } from '@/shared/user/user-settings'

function isMissingUserSettingsColumnError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('UserSettings.') &&
    error.message.includes('does not exist in the current database')
  )
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  let settings: Awaited<ReturnType<typeof prisma.userSettings.findUnique>>
  try {
    settings = await prisma.userSettings.findUnique({ where: { userId } })
  } catch (error) {
    if (isMissingUserSettingsColumnError(error)) {
      return getDefaultUserSettings()
    }
    throw error
  }

  if (!settings) {
    return getDefaultUserSettings()
  }
  return {
    voicePlaybackEnabled: settings.voicePlaybackEnabled,
    voicePlaybackMode: settings.voicePlaybackMode as UserSettings['voicePlaybackMode'],
    soundEffectsEnabled: settings.soundEffectsEnabled,
    defaultInputMode: settings.defaultInputMode as UserSettings['defaultInputMode'],
    memoryEnabled: settings.memoryEnabled,
    explanationMode: settings.explanationMode as UserSettings['explanationMode'],
    fontPreset: settings.fontPreset as UserSettings['fontPreset'],
  }
}
