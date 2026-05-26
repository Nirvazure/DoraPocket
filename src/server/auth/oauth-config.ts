import 'server-only'

export type OAuthProvider = 'github' | 'google'

export const SUPPORTED_OAUTH_PROVIDERS: OAuthProvider[] = ['github', 'google']

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim()
    if (value) return value
  }
  return null
}

export function isOAuthProvider(value: string): value is OAuthProvider {
  return SUPPORTED_OAUTH_PROVIDERS.includes(value as OAuthProvider)
}

export function getOAuthClientConfig(provider: OAuthProvider) {
  if (provider === 'github') {
    const clientId = readEnv('GITHUB_CLIENT_ID', 'SUPABASE_AUTH_EXTERNAL_GITHUB_CLIENT_ID')
    const clientSecret = readEnv('GITHUB_CLIENT_SECRET', 'SUPABASE_AUTH_EXTERNAL_GITHUB_SECRET')
    if (!clientId || !clientSecret) {
      throw new Error(
        '请在 .env.local 中配置 GITHUB_CLIENT_ID 和 GITHUB_CLIENT_SECRET（与 Supabase Dashboard 里填的是同一套 GitHub OAuth 凭证，但 Next.js 无法自动读取 Supabase 后台配置）。',
      )
    }
    return { clientId, clientSecret }
  }

  const clientId = readEnv('GOOGLE_CLIENT_ID', 'SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID')
  const clientSecret = readEnv('GOOGLE_CLIENT_SECRET', 'SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error(
      '请在 .env.local 中配置 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET（与 Supabase Dashboard 里填的是同一套 Google OAuth 凭证，但 Next.js 无法自动读取 Supabase 后台配置）。',
    )
  }
  return { clientId, clientSecret }
}

export function buildOAuthAuthorizeUrl(
  provider: OAuthProvider,
  redirectUri: string,
  state: string,
) {
  const { clientId } = getOAuthClientConfig(provider)

  if (provider === 'github') {
    const url = new URL('https://github.com/login/oauth/authorize')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', 'read:user user:email')
    url.searchParams.set('state', state)
    return url
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('state', state)
  url.searchParams.set('prompt', 'select_account')
  return url
}
