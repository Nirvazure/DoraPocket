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

  try {
    const result = await handleDatabaseWebhookEvent(
      payload as Parameters<typeof handleDatabaseWebhookEvent>[0],
    )
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    const event = payload as { schema?: unknown; table?: unknown; type?: unknown; record?: unknown }
    const record = event.record as { id?: unknown } | null
    console.error(
      '[Supabase webhook] Tool sync failed',
      {
        schema: event.schema,
        table: event.table,
        type: event.type,
        toolId: record && typeof record.id === 'string' ? record.id : null,
      },
      error,
    )
    return NextResponse.json({ ok: false, message: 'Tool sync failed' }, { status: 500 })
  }
}
