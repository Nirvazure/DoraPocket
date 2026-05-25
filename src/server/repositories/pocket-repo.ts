import 'server-only'

import type * as Prisma from '../../generated/prisma/internal/prismaNamespace'
import { prisma } from '@/server/db/prisma'
import type { PocketInventoryItem } from '@/lib/client/pocket-inventory'
import { recordToolOpened, recordToolSaved } from '@/server/repositories/tool-activity-repo'

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined
  return value as Prisma.InputJsonValue
}

function toPocketInventoryItem(item: {
  toolId: string
  savedAt: Date
  lastUsedAt: Date
  useCount: number
  pinned: boolean
  purchased: boolean
  archived: boolean
  sourceQuestion: string | null
  presetArgs: unknown
}): PocketInventoryItem {
  return {
    toolId: item.toolId,
    savedAt: item.savedAt.getTime(),
    lastUsedAt: item.lastUsedAt.getTime(),
    useCount: item.useCount,
    pinned: item.pinned,
    purchased: item.purchased,
    archived: item.archived,
    sourceQuestion: item.sourceQuestion ?? undefined,
    presetArgs:
      item.presetArgs && typeof item.presetArgs === 'object'
        ? (item.presetArgs as Record<string, unknown>)
        : undefined,
  }
}

export async function listPocketItems(userId: string): Promise<PocketInventoryItem[]> {
  const list = await prisma.pocketItem.findMany({
    where: { userId },
    orderBy: [{ pinned: 'desc' }, { archived: 'asc' }, { lastUsedAt: 'desc' }, { savedAt: 'desc' }],
  })
  return list.map(toPocketInventoryItem)
}

export async function saveToolToPocket(
  userId: string,
  input: {
    toolId: string
    sourceQuestion?: string
    presetArgs?: Record<string, unknown>
  },
) {
  await prisma.pocketItem.upsert({
    where: { userId_toolId: { userId, toolId: input.toolId } },
    create: {
      userId,
      toolId: input.toolId,
      sourceQuestion: input.sourceQuestion,
      presetArgs: toJsonValue(input.presetArgs),
    },
    update: {
      sourceQuestion: input.sourceQuestion,
      presetArgs: toJsonValue(input.presetArgs),
    },
  })
  await recordToolSaved(userId, input.toolId)
  return listPocketItems(userId)
}

export async function removeToolFromPocket(userId: string, toolId: string) {
  await prisma.pocketItem.deleteMany({ where: { userId, toolId } })
  return listPocketItems(userId)
}

export async function togglePocketFlag(
  userId: string,
  toolId: string,
  field: 'pinned' | 'purchased' | 'archived',
) {
  const current = await prisma.pocketItem.findUnique({
    where: { userId_toolId: { userId, toolId } },
  })
  if (!current) return listPocketItems(userId)
  await prisma.pocketItem.update({
    where: { userId_toolId: { userId, toolId } },
    data: { [field]: !current[field] },
  })
  return listPocketItems(userId)
}

export async function markToolUsed(userId: string, toolId: string) {
  const current = await prisma.pocketItem.findUnique({
    where: { userId_toolId: { userId, toolId } },
  })
  if (!current) return listPocketItems(userId)
  await prisma.pocketItem.update({
    where: { userId_toolId: { userId, toolId } },
    data: {
      lastUsedAt: new Date(),
      useCount: current.useCount + 1,
    },
  })
  await recordToolOpened(userId, toolId)
  return listPocketItems(userId)
}
