export function verifySupabaseWebhookRequest(request: Request): boolean {
  const secret = process.env.SUPABASE_WEBHOOK_SECRET?.trim()
  if (!secret) return false

  const authorization = request.headers.get('authorization')?.trim()
  return authorization === `Bearer ${secret}`
}
