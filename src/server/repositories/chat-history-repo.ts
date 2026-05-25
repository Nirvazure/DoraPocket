import 'server-only'

import { prisma } from '@/server/db/prisma'
import type { ChatHistoryEntry } from '@/lib/client/chat-history'

function toChatHistoryEntry(item: {
  id: string
  userText: string
  assistantText: string
  selectedToolId: string | null
  createdAt: Date
}): ChatHistoryEntry {
  return {
    id: item.id,
    userText: item.userText,
    assistantText: item.assistantText,
    selectedToolId: item.selectedToolId ?? undefined,
    createdAt: item.createdAt.getTime(),
  }
}

export async function listChatHistory(userId: string, limit = 80): Promise<ChatHistoryEntry[]> {
  const list = await prisma.chatHistoryEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return list.map(toChatHistoryEntry)
}

export async function createChatHistoryEntry(
  userId: string,
  input: {
    userText: string
    assistantText: string
    selectedToolId?: string
  },
) {
  const created = await prisma.chatHistoryEntry.create({
    data: {
      userId,
      userText: input.userText,
      assistantText: input.assistantText,
      selectedToolId: input.selectedToolId ?? null,
    },
  })
  return toChatHistoryEntry(created)
}

export async function clearChatHistory(userId: string) {
  await prisma.chatHistoryEntry.deleteMany({ where: { userId } })
}
