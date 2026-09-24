import assert from 'node:assert/strict'
import test from 'node:test'
import { buildTTSAudioUrl } from './tts'

test('does not return an audio source when the TTS endpoint returns an error response', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: 'TTS upstream failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })

  try {
    assert.equal(await buildTTSAudioUrl('测试'), null)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('returns a playable object URL for a successful audio response', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(new Uint8Array([0x49, 0x44, 0x33]), {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    })

  try {
    const audioUrl = await buildTTSAudioUrl('测试')
    assert.ok(audioUrl?.startsWith('blob:'))
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  } finally {
    globalThis.fetch = originalFetch
  }
})
