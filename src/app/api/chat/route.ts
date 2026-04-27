import { streamPocketGraph } from '@/server/agent/graph'
import { verifySession } from '@/server/auth/dal'
import { buildMarketContextForUser } from '@/server/market/context'
import { createRecommendationSession } from '@/server/repositories/recommendation-session-repo'
import type { ExplanationMode } from '@/services/user-settings'
import { createEmptyMarketContext } from '@/shared/market-defaults'
import type { AgentUiPayload, MarketContext } from '@/shared/market-types'

type ChatRequestBody = {
  message?: string
  answerBookFromPocket?: boolean
  explanationMode?: ExplanationMode
}

function normalizeExplanationMode(value: unknown): ExplanationMode {
  return value === 'brief' ? 'brief' : 'standard'
}

function jsonLine(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(payload)}\n`)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody
    const message = body.message?.trim()
    const explanationMode = normalizeExplanationMode(body.explanationMode)
    if (!message) {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    const session = await verifySession()
    const marketContext: MarketContext = session?.user
      ? await buildMarketContextForUser(session.user.id, 'applied')
      : createEmptyMarketContext()

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let finalText = ''
          let selectedToolId: string | null = null
          let finalUiPayload: AgentUiPayload | null = null

          for await (const event of streamPocketGraph(
            message,
            body.answerBookFromPocket === true,
            marketContext,
            explanationMode,
          )) {
            if (event.type === 'meta') {
              selectedToolId = event.selected_tool?.toolId ?? null
              finalUiPayload = event.ui_payload ?? null
            }
            if (event.type === 'done') {
              finalText = event.text
              selectedToolId = event.selected_tool?.toolId ?? selectedToolId
              finalUiPayload = event.ui_payload ?? finalUiPayload
            }
            controller.enqueue(jsonLine(event))
          }

          if (session?.user && finalText && finalUiPayload) {
            await createRecommendationSession(session.user.id, {
              userText: message,
              finalText,
              selectedToolId,
              uiPayload: finalUiPayload,
            })
          }

          controller.close()
        } catch (error) {
          controller.enqueue(
            jsonLine({
              type: 'error',
              error: error instanceof Error ? error.message : String(error),
            }),
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'chat route failed',
        detail: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      },
    )
  }
}
