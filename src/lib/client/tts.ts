export function buildTTSAudioUrl(text: string): string | null {
  try {
    const params = new URLSearchParams({ text })
    return `/api/aliyun/tts?${params.toString()}`
  } catch {
    return null
  }
}
