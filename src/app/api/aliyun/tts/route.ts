import { NextResponse } from 'next/server'
import { ALIYUN_TTS_VOICE } from '@/constant'
import { fetchNlsToken } from '@/server/aliyun/token'

async function createUpstream(text: string, voice?: string): Promise<Response> {
  const akId = process.env.ALIYUN_AK_ID?.trim() || ''
  const akSecret = process.env.ALIYUN_AK_SECRET?.trim() || ''
  const appkey = process.env.ALIYUN_NLS_APPKEY?.trim() || ''
  if (!akId || !akSecret || !appkey) throw new Error('Aliyun env missing')

  const token = await fetchNlsToken(akId, akSecret)
  return fetch('https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      appkey,
      token,
      text,
      format: 'mp3',
      sample_rate: 16000,
      volume: 50,
      speech_rate: 0,
      pitch_rate: 0,
      voice: voice?.trim() || ALIYUN_TTS_VOICE,
    }),
  })
}

function streamResponse(upstream: Response): Response {
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'audio/mpeg',
      'Cache-Control': 'no-store',
      'Transfer-Encoding': 'chunked',
    },
  })
}

async function handleTts(text: string, voice?: string): Promise<Response> {
  const upstream = await createUpstream(text, voice)
  if (!upstream.ok) {
    const detail = (await upstream.text().catch(() => '')).slice(0, 800)
    return NextResponse.json({ error: 'TTS upstream failed', detail }, { status: 502 })
  }
  return streamResponse(upstream)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text')?.trim()
    const voice = searchParams.get('voice')?.trim() || undefined
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })
    return await handleTts(text, voice)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string; voice?: string }
    const text = body.text?.trim()
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })
    return await handleTts(text, body.voice)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
