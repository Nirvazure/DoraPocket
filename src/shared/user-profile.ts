export const DEFAULT_USER_NICKNAME = '野比大雄'
export const DEFAULT_USER_AVATAR_SRC = '/images/assistant-avatar.svg'

export type UserProfile = {
  nickname: string
  avatarSrc?: string
}

export function getDefaultUserProfile(): UserProfile {
  return {
    nickname: DEFAULT_USER_NICKNAME,
    avatarSrc: DEFAULT_USER_AVATAR_SRC,
  }
}
