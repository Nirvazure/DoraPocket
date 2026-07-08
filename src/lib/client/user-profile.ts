import { readStorageJson } from '@/lib/storage'
import {
  DEFAULT_USER_AVATAR_SRC,
  DEFAULT_USER_NICKNAME,
  getDefaultUserProfile,
  type UserProfile,
} from '@/shared/user/user-profile'

export const USER_PROFILE_STORAGE_KEY = 'dp-user-profile-v1'

export function loadUserProfile(): UserProfile {
  const parsed = readStorageJson<unknown>(USER_PROFILE_STORAGE_KEY, null)
  if (!parsed || typeof parsed !== 'object') {
    return getDefaultUserProfile()
  }
  const rawProfile = parsed as Partial<UserProfile>
  return {
    nickname:
      typeof rawProfile.nickname === 'string' && rawProfile.nickname.trim()
        ? rawProfile.nickname
        : DEFAULT_USER_NICKNAME,
    avatarSrc:
      typeof rawProfile.avatarSrc === 'string' && rawProfile.avatarSrc.trim()
        ? rawProfile.avatarSrc
        : DEFAULT_USER_AVATAR_SRC,
  }
}
