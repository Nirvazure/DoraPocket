import 'server-only'

import {
  establishSupabaseSessionFromGoogleIdToken,
  establishSupabaseSessionFromProfile,
  type OAuthProfile,
} from '@/server/auth/establish-session'
import { getOAuthClientConfig, type OAuthProvider } from '@/server/auth/oauth-config'

type GitHubUserResponse = {
  id: number
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

type GitHubEmailResponse = {
  email: string
  primary: boolean
  verified: boolean
}[]

type GoogleTokenResponse = {
  access_token?: string
  id_token?: string
  error?: string
  error_description?: string
}

type GoogleUserInfoResponse = {
  sub: string
  email?: string
  name?: string
  picture?: string
}

async function exchangeCodeForToken(provider: OAuthProvider, code: string, redirectUri: string) {
  const { clientId, clientSecret } = getOAuthClientConfig(provider)

  if (provider === 'github') {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    })

    const payload = (await response.json()) as {
      access_token?: string
      error?: string
      error_description?: string
    }
    if (!response.ok || !payload.access_token) {
      throw new Error(payload.error_description || payload.error || 'GitHub token exchange failed.')
    }
    return payload.access_token
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const payload = (await response.json()) as GoogleTokenResponse
  if (!response.ok || !payload.id_token) {
    throw new Error(payload.error_description || payload.error || 'Google token exchange failed.')
  }
  return payload.id_token
}

async function fetchGitHubProfile(accessToken: string): Promise<OAuthProfile> {
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'DoraPocket',
    },
  })

  if (!userResponse.ok) {
    throw new Error('Failed to fetch GitHub profile.')
  }

  const user = (await userResponse.json()) as GitHubUserResponse
  let email = user.email?.trim() || null

  if (!email) {
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'DoraPocket',
      },
    })

    if (emailResponse.ok) {
      const emails = (await emailResponse.json()) as GitHubEmailResponse
      email =
        emails.find((item) => item.primary && item.verified)?.email?.trim() ||
        emails.find((item) => item.verified)?.email?.trim() ||
        null
    }
  }

  if (!email) {
    throw new Error('GitHub 账号未提供可用邮箱，请在 GitHub 公开主邮箱后重试。')
  }

  return {
    provider: 'github',
    providerId: String(user.id),
    email,
    nickname: user.name?.trim() || user.login,
    avatarSrc: user.avatar_url,
  }
}

async function fetchGoogleProfile(idToken: string): Promise<OAuthProfile> {
  const response = await fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
  )
  if (!response.ok) {
    throw new Error('Failed to validate Google profile.')
  }

  const user = (await response.json()) as GoogleUserInfoResponse
  const email = user.email?.trim()
  if (!email) {
    throw new Error('Google 账号未提供可用邮箱。')
  }

  return {
    provider: 'google',
    providerId: user.sub,
    email,
    nickname: user.name?.trim() || email.split('@')[0] || '用户',
    avatarSrc: user.picture?.trim() || null,
  }
}

export async function completeOAuthSignIn(
  provider: OAuthProvider,
  code: string,
  redirectUri: string,
) {
  const token = await exchangeCodeForToken(provider, code, redirectUri)

  if (provider === 'google') {
    await establishSupabaseSessionFromGoogleIdToken(token)
    return fetchGoogleProfile(token)
  }

  const profile = await fetchGitHubProfile(token)
  await establishSupabaseSessionFromProfile(profile)
  return profile
}
