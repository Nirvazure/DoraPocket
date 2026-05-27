import { NextRequest, NextResponse } from 'next/server'
import { buildOAuthAuthorizeUrl, isOAuthProvider } from '@/server/auth/oauth-config'
import { createOAuthState } from '@/server/auth/oauth-state'

type RouteContext = {
  params: Promise<{ provider: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { provider } = await context.params
  if (!isOAuthProvider(provider)) {
    return NextResponse.json({ error: 'Unsupported provider.' }, { status: 400 })
  }

  try {
    const next = request.nextUrl.searchParams.get('next')?.trim() || '/analyse'
    const state = await createOAuthState(next)
    const redirectUri = new URL(`/api/auth/oauth/${provider}/callback`, request.url).toString()
    const authorizeUrl = buildOAuthAuthorizeUrl(provider, redirectUri, state)
    return NextResponse.redirect(authorizeUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OAuth is not configured.'
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
    )
  }
}
