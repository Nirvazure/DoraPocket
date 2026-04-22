export type AliyunSttCallbacks = {
  onResult: (text: string) => void
  onError: (code: string) => void
  onEnd: () => void
}

type NlsTokenResponse = {
  token: string
  appkey: string
  wsUrl: string
}

type WorkletMessage = {
  pcm?: ArrayBuffer
  level?: number
}

type ActiveSttSession = {
  ws: WebSocket
  stream: MediaStream
  audioContext: AudioContext
  sourceNode: MediaStreamAudioSourceNode
  workletNode: AudioWorkletNode
  vadInterval: number
  isClosing: boolean
  lastVoiceAt: number
}

let activeSession: ActiveSttSession | null = null

async function fetchNlsSessionToken(): Promise<NlsTokenResponse> {
  const response = await fetch('/api/aliyun/nls-token')
  if (!response.ok) {
    throw new Error(`nls-token failed: ${response.status}`)
  }
  return (await response.json()) as NlsTokenResponse
}

function pickResultText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const record = payload as Record<string, unknown>
  const result = record.result ?? record.sentence ?? record.text
  return typeof result === 'string' ? result : ''
}

function cleanupSession(session: ActiveSttSession | null) {
  if (!session || session.isClosing) return
  session.isClosing = true
  window.clearInterval(session.vadInterval)
  session.workletNode.port.onmessage = null
  session.workletNode.disconnect()
  session.sourceNode.disconnect()
  session.stream.getTracks().forEach((track) => track.stop())
  if (session.ws.readyState === WebSocket.OPEN || session.ws.readyState === WebSocket.CONNECTING) {
    session.ws.close()
  }
  void session.audioContext.close()
}

function stopFromVAD(callbacks: AliyunSttCallbacks) {
  stopAliyunSttSession()
  callbacks.onEnd()
}

async function createAudioWorklet(stream: MediaStream): Promise<{
  audioContext: AudioContext
  sourceNode: MediaStreamAudioSourceNode
  workletNode: AudioWorkletNode
}> {
  const audioContext = new AudioContext()
  await audioContext.audioWorklet.addModule('/worklets/pcm-capture-processor.js')
  const sourceNode = audioContext.createMediaStreamSource(stream)
  const workletNode = new AudioWorkletNode(audioContext, 'pcm-capture-processor')
  sourceNode.connect(workletNode)
  return { audioContext, sourceNode, workletNode }
}

export async function startAliyunSttSession(callbacks: AliyunSttCallbacks): Promise<boolean> {
  try {
    const tokenData = await fetchNlsSessionToken()
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    })
    const { audioContext, sourceNode, workletNode } = await createAudioWorklet(stream)
    const ws = new WebSocket(`${tokenData.wsUrl}?token=${encodeURIComponent(tokenData.token)}`)

    const session: ActiveSttSession = {
      ws,
      stream,
      audioContext,
      sourceNode,
      workletNode,
      vadInterval: 0,
      isClosing: false,
      lastVoiceAt: Date.now(),
    }
    activeSession = session

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          header: {
            message_id: crypto.randomUUID(),
            namespace: 'SpeechRecognizer',
            name: 'StartTranscription',
            appkey: tokenData.appkey,
          },
          payload: {
            format: 'pcm',
            sample_rate: 16000,
            enable_intermediate_result: true,
            enable_punctuation_prediction: true,
            enable_inverse_text_normalization: true,
          },
        }),
      )
    }

    workletNode.port.onmessage = (event: MessageEvent<WorkletMessage>) => {
      if (session.isClosing || ws.readyState !== WebSocket.OPEN) return
      const level = typeof event.data.level === 'number' ? event.data.level : 0
      if (level > 0.01) {
        session.lastVoiceAt = Date.now()
      }
      if (event.data.pcm) {
        ws.send(event.data.pcm)
      }
    }

    session.vadInterval = window.setInterval(() => {
      if (session.isClosing) return
      if (Date.now() - session.lastVoiceAt > 1800) {
        stopFromVAD(callbacks)
      }
    }, 250)

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data !== 'string') return
      try {
        const data = JSON.parse(event.data) as { payload?: unknown }
        const text = pickResultText(data.payload)
        if (text) {
          callbacks.onResult(text)
          session.lastVoiceAt = Date.now()
        }
      } catch {
        // ignore malformed frames
      }
    }

    ws.onerror = () => callbacks.onError('network')
    ws.onclose = () => {
      const current = activeSession
      if (current === session) {
        cleanupSession(session)
        activeSession = null
      }
      callbacks.onEnd()
    }
    return true
  } catch (error) {
    console.error('[aliyun-stt]', error)
    callbacks.onError('start-failed')
    return false
  }
}

export function stopAliyunSttSession() {
  const session = activeSession
  if (!session) return
  cleanupSession(session)
  activeSession = null
}

export function disposeAliyunSttSession() {
  stopAliyunSttSession()
}

