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
          clarificationStatus: 'ready',
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

test('askQwen sends the selected recommendation mode', async () => {
  const originalFetch = globalThis.fetch
  const requestBodyRef = { value: null as Record<string, unknown> | null }
  globalThis.fetch = async (_input, init) => {
    requestBodyRef.value = JSON.parse(String(init?.body)) as Record<string, unknown>
    return new Response(
      streamFromLines([
        {
          type: 'done',
          text: 'done',
          clarificationStatus: 'ready',
          selected_tool: null,
          ui_payload: null,
        },
      ]),
      { status: 200 },
    )
  }

  try {
    await askQwen('hello', { recommendationMode: 'web' })
    assert.equal(requestBodyRef.value?.recommendationMode, 'web')
  } finally {
    globalThis.fetch = originalFetch
  }
})

for (const [recommendationLimit, minMatchScore] of [
  [undefined, 80],
  [3, 90],
  [5, 80],
  [10, 70],
] as const) {
  test(`askQwen sends normalized preferences for ${recommendationLimit ?? 'default'} recommendations`, async () => {
    const originalFetch = globalThis.fetch
    const requestBodyRef: { value?: Record<string, unknown> } = {}
    globalThis.fetch = async (_input, init) => {
      requestBodyRef.value = JSON.parse(String(init?.body)) as Record<string, unknown>
      return new Response(
        streamFromLines([
          {
            type: 'done',
            text: 'ok',
            clarificationStatus: 'ready',
            selected_tool: null,
            ui_payload: null,
          },
        ]),
        { status: 200 },
      )
    }

    try {
      await askQwen('hello', {
        recommendationPreferences:
          recommendationLimit === undefined
            ? undefined
            : { minMatchScore: 85, recommendationLimit },
      })
      assert.equal(requestBodyRef.value?.minMatchScore, minMatchScore)
      assert.equal(requestBodyRef.value?.recommendationLimit, recommendationLimit ?? 5)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
}
