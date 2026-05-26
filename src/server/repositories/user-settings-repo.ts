import 'server-only'

import { prisma } from '@/server/db/prisma'
import { getDefaultUserSettings, type UserSettings } from '@/shared/user-settings'

function isMissingBuiltinToolsColumnError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes('UserSettings.builtinToolsEnabled') &&
    error.message.includes('does not exist')
  )
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  let settings: Awaited<ReturnType<typeof prisma.userSettings.findUnique>>
  try {
    settings = await prisma.userSettings.findUnique({ where: { userId } })
  } catch (error) {
    if (isMissingBuiltinToolsColumnError(error)) {
      return getDefaultUserSettings()
    }
    throw error
  }

  if (!settings) {
    return getDefaultUserSettings()
  }
  const settingsWithBuiltin = settings as typeof settings & {
    builtinToolsEnabled?: boolean | null
  }
  return {
    voicePlaybackEnabled: settings.voicePlaybackEnabled,
    voicePlaybackMode: settings.voicePlaybackMode as UserSettings['voicePlaybackMode'],
    soundEffectsEnabled: settings.soundEffectsEnabled,
    defaultInputMode: settings.defaultInputMode as UserSettings['defaultInputMode'],
    memoryEnabled: settings.memoryEnabled,
    builtinToolsEnabled: settingsWithBuiltin.builtinToolsEnabled === true,
    explanationMode: settings.explanationMode as UserSettings['explanationMode'],
    fontPreset: settings.fontPreset as UserSettings['fontPreset'],
  }
}

export async function upsertUserSettings(userId: string, input: UserSettings) {
  try {
    return await prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...input },
      update: { ...input },
    })
  } catch (error) {
    if (!isMissingBuiltinToolsColumnError(error)) {
      throw error
    }

    const legacyInput = {
      voicePlaybackEnabled: input.voicePlaybackEnabled,
      voicePlaybackMode: input.voicePlaybackMode,
      soundEffectsEnabled: input.soundEffectsEnabled,
      defaultInputMode: input.defaultInputMode,
      memoryEnabled: input.memoryEnabled,
      explanationMode: input.explanationMode,
      fontPreset: input.fontPreset,
    }
    return prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...legacyInput },
      update: { ...legacyInput },
    })
  }
}
