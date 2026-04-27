import 'server-only'

import { prisma } from '@/server/db/prisma'
import { upsertSeedTools } from '@/server/repositories/tool-repo'

export async function seedToolsForUser(userId: string) {
  await upsertSeedTools(userId)
  await prisma.dataMigrationState.upsert({
    where: { userId },
    create: {
      userId,
      toolSeedImportedAt: new Date(),
    },
    update: {
      toolSeedImportedAt: new Date(),
    },
  })
}
