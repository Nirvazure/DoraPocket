import assert from 'node:assert/strict'
import test from 'node:test'

import { askQwen } from '@/lib/client/llm'

function streamFromLines(lines: unknown[]) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(`${JSON.stringify(line)}\n`))
      }
      controller.close()
    },
  })
}

test('askQwen returns recommendationSessionId from stream event', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(
      streamFromLines([
        {
          type: 'done',
          text: 'done',
          step2Status: 'ready',
          selected_tool: null,
          ui_payload: null,
        },
        {
          type: 'recommendation_session',
          recommendationSessionId: 'rec-1',
          selectedToolId: 'tool-1',
        },
      ]),
      { status: 200 },
    )

  try {
    const reply = await askQwen('hello')
    assert.equal(reply.recommendationSessionId, 'rec-1')
  } finally {
    globalThis.fetch = originalFetch
  }
})
