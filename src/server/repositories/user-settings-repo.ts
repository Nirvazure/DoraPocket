import 'server-only'

import { prisma } from '@/server/db/prisma'
import { getDefaultUserSettings, type UserSettings } from '@/services/user-settings'

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const settings = await prisma.userSettings.findUnique({ where: { userId } })
  if (!settings) {
    return getDefaultUserSettings()
  }
  return {
    voicePlaybackEnabled: settings.voicePlaybackEnabled,
    voicePlaybackMode: settings.voicePlaybackMode as UserSettings['voicePlaybackMode'],
    soundEffectsEnabled: settings.soundEffectsEnabled,
    defaultInputMode: settings.defaultInputMode as UserSettings['defaultInputMode'],
    autoSaveToPocketEnabled: settings.autoSaveToPocketEnabled,
    memoryEnabled: settings.memoryEnabled,
    explanationMode: settings.explanationMode as UserSettings['explanationMode'],
    fontPreset: settings.fontPreset as UserSettings['fontPreset'],
  }
}

export async function upsertUserSettings(userId: string, input: UserSettings) {
  return prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...input },
    update: { ...input },
  })
}
