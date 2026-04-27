// Legacy local storage bridge. Cloud user profile is now served via /api/me/profile.
import { readStorageJson, writeStorageJson } from '@/lib/storage'

export const USER_PROFILE_STORAGE_KEY = 'dp-user-profile-v1'
export const USER_PROFILE_UPDATED_EVENT = 'dp-user-profile-updated'
export const DEFAULT_USER_NICKNAME = 'Nirvazure'
export const DEFAULT_USER_AVATAR_SRC = '/branding/assistant-avatar.svg'

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

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return
  const nextProfile: UserProfile = {
    nickname: profile.nickname?.trim() ? profile.nickname : DEFAULT_USER_NICKNAME,
    avatarSrc: profile.avatarSrc?.trim() ? profile.avatarSrc : DEFAULT_USER_AVATAR_SRC,
  }
  writeStorageJson(USER_PROFILE_STORAGE_KEY, nextProfile)
  window.dispatchEvent(
    new CustomEvent<UserProfile>(USER_PROFILE_UPDATED_EVENT, { detail: nextProfile }),
  )
}

export function subscribeUserProfile(listener: (profile: UserProfile) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const handleCustomUpdate = (event: Event) => {
    const customEvent = event as CustomEvent<UserProfile>
    listener(customEvent.detail ?? loadUserProfile())
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== USER_PROFILE_STORAGE_KEY) return
    listener(loadUserProfile())
  }

  window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleCustomUpdate)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleCustomUpdate)
    window.removeEventListener('storage', handleStorage)
  }
}

export function readAvatarFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('仅支持图片文件'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('头像读取失败'))
        return
      }
      resolve(reader.result)
    }
    reader.onerror = () => reject(new Error('头像读取失败'))
    reader.readAsDataURL(file)
  })
}
