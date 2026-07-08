import 'server-only'

import type { AppUser } from '@/server/auth/user-sync'
import { getDefaultUserSettings, type UserSettings } from '@/shared/user/user-settings'

export const DEV_MOCK_USER_ID = 'dev-mock-user'

let mockSettings: UserSettings = getDefaultUserSettings()

export function isDevMockAuthEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.DEV_MOCK_AUTH === 'true'
}

export function isDevMockUserId(userId: string): boolean {
  return isDevMockAuthEnabled() && userId === DEV_MOCK_USER_ID
}

export function getDevMockAppUser(): AppUser {
  const now = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: DEV_MOCK_USER_ID,
    supabaseUserId: 'dev-mock-supabase-user',
    email: 'dev@dorapocket.local',
    nickname: 'Nirvazure',
    avatarSrc: '/images/assistant-avatar.svg',
    bio: null,
    website: null,
    company: null,
    authCreatedAt: now,
    lastSignInAt: now,
    authRole: 'authenticated',
    authProvider: 'github',
    createdAt: now,
    updatedAt: now,
  }
}

export function getDevMockSession() {
  return {
    supabaseUserId: 'dev-mock-supabase-user',
    email: 'dev@dorapocket.local',
    expiresAt: null,
    user: getDevMockAppUser(),
    isAuth: true as const,
  }
}

export function getDevMockUserSettings(): UserSettings {
  return mockSettings
}

export function setDevMockUserSettings(next: UserSettings): UserSettings {
  mockSettings = next
  return mockSettings
}
