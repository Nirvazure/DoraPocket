import { streamPocketGraph } from '@/server/agent/graph'
import type { MarketContext } from '@/shared/market-types'

type ChatRequestBody = {
  message?: string
  answerBookFromPocket?: boolean
  marketContext?: MarketContext
}

function jsonLine(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(payload)}\n`)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody
    const message = body.message?.trim()
    const marketContext: MarketContext = body.marketContext ?? {
      savedItems: [],
      feedback: [],
      subscriptions: [],
      submissions: [],
      preferenceProfile: {
        preferredCategories: [],
        preferredTags: [],
        preferredPlatforms: [],
        preferredPricing: [],
        preferredExecutionModes: [],
        avoidAuthWall: true,
        prefersSubscriptionTools: false,
        summary: [],
      },
    }
    if (!message) {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      })
    }

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of streamPocketGraph(message, body.answerBookFromPocket === true, marketContext)) {
            controller.enqueue(jsonLine(event))
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
