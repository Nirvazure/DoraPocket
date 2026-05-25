import 'server-only'

import { prisma } from '@/server/db/prisma'
import {
  DEFAULT_USER_AVATAR_SRC,
  DEFAULT_USER_NICKNAME,
  type UserProfile,
} from '@/lib/client/user-profile'

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true, avatarSrc: true },
  })
  return {
    nickname: user?.nickname?.trim() || DEFAULT_USER_NICKNAME,
    avatarSrc: user?.avatarSrc?.trim() || DEFAULT_USER_AVATAR_SRC,
  }
}

export async function updateUserProfile(userId: string, input: UserProfile) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      nickname: input.nickname?.trim() || DEFAULT_USER_NICKNAME,
      avatarSrc: input.avatarSrc?.trim() || DEFAULT_USER_AVATAR_SRC,
    },
  })
}
