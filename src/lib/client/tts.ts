export async function buildTTSAudioUrl(text: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({ text })
    const response = await fetch(`/api/aliyun/tts?${params.toString()}`, {
      cache: 'no-store',
    })
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
    if (!response.ok || !contentType.startsWith('audio/')) return null

    const audioBlob = await response.blob()
    if (audioBlob.size === 0) return null
    return URL.createObjectURL(audioBlob)
  } catch {
    return null
  }
}
