import 'server-only'

import { prisma } from '@/server/db/prisma'
import type { LegacyLocalSnapshot } from '@/lib/client/legacy-snapshot-read'
import type * as Prisma from '../../generated/prisma/internal/prismaNamespace'

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined
  return value as Prisma.InputJsonValue
}

export async function importLocalSnapshotForUser(userId: string, snapshot: LegacyLocalSnapshot) {
  const state = await prisma.dataMigrationState.findUnique({ where: { userId } })
  if (state?.localDataImportedAt) {
    return state
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        nickname: snapshot.userProfile.nickname,
        avatarSrc: snapshot.userProfile.avatarSrc ?? null,
      },
    })

    await tx.userSettings.upsert({
      where: { userId },
      create: { userId, ...snapshot.userSettings },
      update: { ...snapshot.userSettings },
    })

    for (const item of snapshot.pocketInventory) {
      await tx.pocketItem.upsert({
        where: { userId_toolId: { userId, toolId: item.toolId } },
        create: {
          userId,
          toolId: item.toolId,
          savedAt: new Date(item.savedAt),
          lastUsedAt: new Date(item.lastUsedAt),
          useCount: item.useCount,
          pinned: item.pinned,
          purchased: item.purchased,
          archived: item.archived,
          sourceQuestion: item.sourceQuestion ?? null,
          presetArgs: toJsonValue(item.presetArgs),
        },
        update: {
          savedAt: new Date(item.savedAt),
          lastUsedAt: new Date(item.lastUsedAt),
          useCount: item.useCount,
          pinned: item.pinned,
          purchased: item.purchased,
          archived: item.archived,
          sourceQuestion: item.sourceQuestion ?? null,
          presetArgs: toJsonValue(item.presetArgs),
        },
      })
    }

    for (const item of snapshot.marketFeedback) {
      await tx.marketFeedback.upsert({
        where: { userId_toolId: { userId, toolId: item.toolId } },
        create: {
          userId,
          toolId: item.toolId,
          vote: item.vote,
          starRating: item.starRating,
          selectedTags: item.selectedTags,
          updatedAt: new Date(item.updatedAt),
        },
        update: {
          vote: item.vote,
          starRating: item.starRating,
          selectedTags: item.selectedTags,
          updatedAt: new Date(item.updatedAt),
        },
      })
    }

    for (const item of snapshot.marketSubscriptions) {
      await tx.marketSubscription.upsert({
        where: { userId_toolId: { userId, toolId: item.toolId } },
        create: {
          userId,
          toolId: item.toolId,
          active: item.active,
          subscribedAt: new Date(item.subscribedAt),
        },
        update: {
          active: item.active,
          subscribedAt: new Date(item.subscribedAt),
        },
      })
    }

    for (const item of snapshot.marketSubmissions) {
      await tx.marketSubmission.create({
        data: {
          userId,
          name: item.name,
          url: item.url,
          description: item.description,
          tags: item.tags,
          submittedAt: new Date(item.submittedAt),
          status: item.status,
        },
      })
    }

    for (const item of snapshot.chatHistory) {
      await tx.chatHistoryEntry.create({
        data: {
          userId,
          userText: item.userText,
          assistantText: item.assistantText,
          selectedToolId: item.selectedToolId ?? null,
          createdAt: new Date(item.createdAt),
        },
      })
    }

    await tx.preferenceProfileOverride.upsert({
      where: { userId },
      create: {
        userId,
        preferredCategories: snapshot.preferenceProfileOverride.preferredCategories ?? [],
        preferredTags: snapshot.preferenceProfileOverride.preferredTags ?? [],
        preferredPlatforms: snapshot.preferenceProfileOverride.preferredPlatforms ?? [],
        preferredPricing: snapshot.preferenceProfileOverride.preferredPricing ?? [],
        preferredExecutionModes: snapshot.preferenceProfileOverride.preferredExecutionModes ?? [],
        avoidAuthWall: snapshot.preferenceProfileOverride.avoidAuthWall ?? null,
        prefersSubscriptionTools:
          snapshot.preferenceProfileOverride.prefersSubscriptionTools ?? null,
      },
      update: {
        preferredCategories: snapshot.preferenceProfileOverride.preferredCategories ?? [],
        preferredTags: snapshot.preferenceProfileOverride.preferredTags ?? [],
        preferredPlatforms: snapshot.preferenceProfileOverride.preferredPlatforms ?? [],
        preferredPricing: snapshot.preferenceProfileOverride.preferredPricing ?? [],
        preferredExecutionModes: snapshot.preferenceProfileOverride.preferredExecutionModes ?? [],
        avoidAuthWall: snapshot.preferenceProfileOverride.avoidAuthWall ?? null,
        prefersSubscriptionTools:
          snapshot.preferenceProfileOverride.prefersSubscriptionTools ?? null,
      },
    })

    for (const [toolId, stats] of Object.entries(snapshot.toolActivityMap)) {
      await tx.toolActivity.upsert({
        where: { userId_toolId: { userId, toolId } },
        create: {
          userId,
          toolId,
          saves: stats.saves,
          opens: stats.opens,
          subscriptions: stats.subscriptions,
        },
        update: {
          saves: stats.saves,
          opens: stats.opens,
          subscriptions: stats.subscriptions,
        },
      })
    }

    await tx.dataMigrationState.upsert({
      where: { userId },
      create: { userId, localDataImportedAt: new Date() },
      update: { localDataImportedAt: new Date() },
    })
  })
}
