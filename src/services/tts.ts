export async function fetchTTSAudio(text: string): Promise<string | null> {
  try {
    const voice = process.env.NEXT_PUBLIC_ALIYUN_TTS_VOICE?.trim()
    const params = new URLSearchParams({ text })
    if (voice) params.set('voice', voice)
    return `/api/aliyun/tts?${params.toString()}`
  } catch {
    return null
  }
}

