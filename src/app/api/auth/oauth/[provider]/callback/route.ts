import { NextRequest, NextResponse } from 'next/server'
import { finishOAuthLogin } from '@/server/auth/finish-oauth-login'
import { isOAuthProvider } from '@/server/auth/oauth-config'
import { completeOAuthSignIn } from '@/server/auth/oauth-providers'
import { consumeOAuthState } from '@/server/auth/oauth-state'

type RouteContext = {
  params: Promise<{ provider: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider } = await context.params
  if (!isOAuthProvider(provider)) {
    return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 })
  }

  const code = request.nextUrl.searchParams.get('code')?.trim()
  const state = request.nextUrl.searchParams.get('state')?.trim() || null
  const oauthState = await consumeOAuthState(state)

  if (!oauthState) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url))
  }

  if (!code) {
    const providerError =
      request.nextUrl.searchParams.get('error_description') ||
      request.nextUrl.searchParams.get('error') ||
      'oauth_cancelled'
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(providerError)}`, request.url),
    )
  }

  try {
    const redirectUri = new URL(`/api/auth/oauth/${provider}/callback`, request.url).toString()
    await completeOAuthSignIn(provider, code, redirectUri)
    return finishOAuthLogin(request, oauthState.next)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OAuth login failed.'
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
    )
  }
}
