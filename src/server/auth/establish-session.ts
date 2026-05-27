import 'server-only'

import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase/server'
import type { OAuthProvider } from '@/server/auth/oauth-config'

export type OAuthProfile = {
  provider: OAuthProvider
  providerId: string
  email: string
  nickname: string
  avatarSrc?: string | null
}

export async function establishSupabaseSessionFromGoogleIdToken(idToken: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  })
  if (error) {
    throw new Error(error.message)
  }
}

export async function establishSupabaseSessionFromProfile(profile: OAuthProfile) {
  const admin = createSupabaseAdminClient()

  const { error: createError } = await admin.auth.admin.createUser({
    email: profile.email,
    email_confirm: true,
    user_metadata: {
      full_name: profile.nickname,
      name: profile.nickname,
      avatar_url: profile.avatarSrc,
      picture: profile.avatarSrc,
      provider_id: profile.providerId,
    },
    app_metadata: {
      provider: profile.provider,
      providers: [profile.provider],
    },
  })

  if (createError && !createError.message.toLowerCase().includes('already')) {
    throw new Error(createError.message)
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: profile.email,
  })
  if (linkError || !linkData.properties.hashed_token) {
    throw new Error(linkError?.message || 'Failed to create Supabase session.')
  }

  const supabase = await createSupabaseServerClient()
  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: linkData.properties.hashed_token,
  })
  if (verifyError) {
    throw new Error(verifyError.message)
  }
}
