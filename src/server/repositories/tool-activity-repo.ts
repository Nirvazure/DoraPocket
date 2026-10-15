import 'server-only'

import { prisma } from '@/server/db/prisma'

export async function getToolActivityMap(userId: string) {
  const list = await prisma.toolActivity.findMany({ where: { userId } })
  return Object.fromEntries(
    list.map((item) => [
      item.toolId,
      {
        saves: item.saves,
        opens: item.opens,
      },
    ]),
  )
}

async function upsertCounter(
  userId: string,
  toolId: string,
  patch: Partial<{ saves: number; opens: number }>,
) {
  const existing = await prisma.toolActivity.findUnique({
    where: { userId_toolId: { userId, toolId } },
  })
  return prisma.toolActivity.upsert({
    where: { userId_toolId: { userId, toolId } },
    create: {
      userId,
      toolId,
      saves: patch.saves ?? 0,
      opens: patch.opens ?? 0,
    },
    update: {
      saves: patch.saves ?? existing?.saves ?? 0,
      opens: patch.opens ?? existing?.opens ?? 0,
    },
  })
}

export async function recordToolSaved(userId: string, toolId: string) {
  const current = await prisma.toolActivity.findUnique({
    where: { userId_toolId: { userId, toolId } },
  })
  await upsertCounter(userId, toolId, { saves: (current?.saves ?? 0) + 1 })
}

export async function recordToolOpened(userId: string, toolId: string) {
  const current = await prisma.toolActivity.findUnique({
    where: { userId_toolId: { userId, toolId } },
  })
  await upsertCounter(userId, toolId, { opens: (current?.opens ?? 0) + 1 })
}
