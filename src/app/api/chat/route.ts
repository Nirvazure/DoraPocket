import { streamPocketGraph } from '@/server/agent/graph'
import { verifySession } from '@/server/auth/dal'
import { buildMarketContextForUser } from '@/server/market/context'
import { createRecommendationSession } from '@/server/repositories/recommendation-session-repo'
import type { ExplanationMode } from '@/shared/user-settings'
import { createEmptyMarketContext } from '@/shared/market-defaults'
import type { AgentUiPayload, MarketContext } from '@/shared/market-types'
import type { Step2DoneStatus } from '@/shared/step2-session-types'

type ChatRequestBody = {
  message?: string
  sessionTurn?: 1 | 2 | 3
  anchorPrompt?: string
  priorMessages?: Array<{ role: 'user' | 'assistant'; content: string }>
  skipClarify?: boolean
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

    const step2Input = {
      sessionTurn: (body.sessionTurn ?? 1) as 1 | 2 | 3,
      anchorPrompt: body.anchorPrompt?.trim() || message,
      priorMessages: body.priorMessages ?? [],
      skipClarify: body.skipClarify === true,
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let finalText = ''
          let selectedToolId: string | null = null
          let finalUiPayload: AgentUiPayload | null = null
          let step2Status: Step2DoneStatus | undefined

          for await (const event of streamPocketGraph(
            message,
            marketContext,
            explanationMode,
            step2Input,
          )) {
            if (event.type === 'meta') {
              selectedToolId = event.selected_tool?.toolId ?? null
              finalUiPayload = event.ui_payload ?? null
            }
            if (event.type === 'done') {
              finalText = event.text
              step2Status = event.step2Status
              selectedToolId = event.selected_tool?.toolId ?? selectedToolId
              finalUiPayload = event.ui_payload ?? finalUiPayload
            }
            controller.enqueue(jsonLine(event))
          }

          const shouldPersistSession = step2Status === 'ready' || step2Status === 'exhausted'
          if (session?.user && finalText && finalUiPayload && shouldPersistSession) {
            const userText = body.anchorPrompt?.trim() || message
            await createRecommendationSession(session.user.id, {
              userText,
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
