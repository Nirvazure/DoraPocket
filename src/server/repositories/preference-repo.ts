import 'server-only'

import { prisma } from '@/server/db/prisma'
import type { PreferenceProfileOverride } from '@/shared/market-types'

export async function getPreferenceProfileOverride(
  userId: string,
): Promise<PreferenceProfileOverride> {
  const current = await prisma.preferenceProfileOverride.findUnique({ where: { userId } })
  if (!current) return {}
  return {
    preferredCategories:
      current.preferredCategories as PreferenceProfileOverride['preferredCategories'],
    preferredTags: current.preferredTags,
    preferredPlatforms:
      current.preferredPlatforms as PreferenceProfileOverride['preferredPlatforms'],
    preferredPricing: current.preferredPricing as PreferenceProfileOverride['preferredPricing'],
    preferredExecutionModes:
      current.preferredExecutionModes as PreferenceProfileOverride['preferredExecutionModes'],
    avoidAuthWall: current.avoidAuthWall ?? undefined,
    prefersSubscriptionTools: current.prefersSubscriptionTools ?? undefined,
  }
}

export async function savePreferenceProfileOverride(
  userId: string,
  input: PreferenceProfileOverride,
) {
  await prisma.preferenceProfileOverride.upsert({
    where: { userId },
    create: {
      userId,
      preferredCategories: input.preferredCategories ?? [],
      preferredTags: input.preferredTags ?? [],
      preferredPlatforms: (input.preferredPlatforms as string[]) ?? [],
      preferredPricing: (input.preferredPricing as string[]) ?? [],
      preferredExecutionModes: (input.preferredExecutionModes as string[]) ?? [],
      avoidAuthWall: input.avoidAuthWall ?? null,
      prefersSubscriptionTools: input.prefersSubscriptionTools ?? null,
    },
    update: {
      preferredCategories: input.preferredCategories ?? [],
      preferredTags: input.preferredTags ?? [],
      preferredPlatforms: (input.preferredPlatforms as string[]) ?? [],
      preferredPricing: (input.preferredPricing as string[]) ?? [],
      preferredExecutionModes: (input.preferredExecutionModes as string[]) ?? [],
      avoidAuthWall: input.avoidAuthWall ?? null,
      prefersSubscriptionTools: input.prefersSubscriptionTools ?? null,
    },
  })
  return getPreferenceProfileOverride(userId)
}

export async function resetPreferenceProfileOverride(userId: string) {
  await prisma.preferenceProfileOverride.deleteMany({ where: { userId } })
  return {}
}
