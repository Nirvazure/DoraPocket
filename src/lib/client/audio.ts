import { disposeAliyunSttSession, startAliyunSttSession } from '@/lib/client/stt-aliyun-ws'

export type SpeechSessionCallbacks = {
  onResult: (text: string) => void
  onEnd: () => void
  onError: (code: string) => void
}

export function disposeSpeechSession() {
  disposeAliyunSttSession()
}

export function startSpeechSession(callbacks: SpeechSessionCallbacks): Promise<boolean> {
  return startAliyunSttSession(callbacks)
}

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let dataArray: Uint8Array | null = null
let currentAudio: HTMLAudioElement | null = null
let currentSource: MediaElementAudioSourceNode | null = null

function isAutoplayBlocked(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'NotAllowedError'
}

export function initAudioContext() {
  if (!audioContext) {
    const webkitCtor = (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
    const Ctor = window.AudioContext ?? webkitCtor
    if (!Ctor) return
    audioContext = new Ctor()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    dataArray = new Uint8Array(analyser.frequencyBinCount)
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }
}

export function playAudioStream(audioUrl: string, onEnded: () => void) {
  initAudioContext()
  stopAudioPlayback()

  currentAudio = new Audio(audioUrl)
  currentAudio.crossOrigin = 'anonymous'
  if (audioContext && analyser) {
    currentSource = audioContext.createMediaElementSource(currentAudio)
    currentSource.connect(analyser)
    analyser.connect(audioContext.destination)
  }
  currentAudio.onended = () => {
    onEnded()
    stopAudioPlayback()
  }
  void currentAudio.play().catch((error) => {
    if (!isAutoplayBlocked(error)) {
      console.error('Audio playback failed', error)
    }
    stopAudioPlayback()
    onEnded()
  })
}

export function stopAudioPlayback() {
  if (currentAudio) {
    currentAudio.onended = null
    currentAudio.pause()
    currentAudio.src = ''
    currentAudio.load()
    currentAudio = null
  }
  if (currentSource) {
    currentSource.disconnect()
    currentSource = null
  }
}

export function playDoraPocketSfx(): Promise<void> {
  initAudioContext()
  try {
    const el = new Audio('/audio/dora.mp3')
    return el
      .play()
      .then(() => undefined)
      .catch((error) => {
        if (!isAutoplayBlocked(error)) {
          console.warn('Dora pocket sfx failed', error)
        }
      })
  } catch (error) {
    if (!isAutoplayBlocked(error)) {
      console.warn('Dora pocket sfx failed', error)
    }
    return Promise.resolve()
  }
}

export function getAudioFrequency(): number {
  if (!analyser || !dataArray) return 0
  analyser.getByteFrequencyData(dataArray as Parameters<AnalyserNode['getByteFrequencyData']>[0])
  let sum = 0
  for (let i = 0; i < dataArray.length; i += 1) {
    sum += dataArray[i]
  }
  return sum / dataArray.length
}
