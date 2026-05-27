import { NextResponse } from 'next/server'
import { handleDatabaseWebhookEvent } from '@/server/webhooks/handle-database-event'
import { verifySupabaseWebhookRequest } from '@/server/webhooks/verify-supabase-webhook'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  if (!verifySupabaseWebhookRequest(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
  }

  const result = await handleDatabaseWebhookEvent(
    payload as Parameters<typeof handleDatabaseWebhookEvent>[0],
  )

  return NextResponse.json({ ok: true, ...result })
}
