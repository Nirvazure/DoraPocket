import { useCallback, useEffect, useRef } from 'react'
import {
  disposeSpeechSession,
  initAudioContext,
  startSpeechSession,
  stopAudioPlayback,
} from '@/lib/client/audio'
import { VOICE_COPY } from '@/shared/ui-copy'
import type { AppState } from '@/store'
import { useStore } from '@/store'

type UseVoiceInputOptions = {
  appState: AppState
  runAgentTurn: (text: string) => Promise<void>
  setAppState: (state: AppState) => void
  setTranscript: (text: string) => void
  setBotResponse: (text: string) => void
  setLastSpeechError: (message: string) => void
  setSystemNotice: (notice: {
    level: 'task' | 'ambient' | 'critical' | 'silent'
    message: string
    autoDismissMs?: number
  }) => void
  clearResponseState: () => void
}

function speechErrorMessage(code: string): string {
  const map = VOICE_COPY.errors as Record<string, string>
  return map[code] ?? `${VOICE_COPY.fallbackErrorPrefix}${code}`
}

export function useVoiceInput({
  appState,
  runAgentTurn,
  setAppState,
  setTranscript,
  setBotResponse,
  setLastSpeechError,
  setSystemNotice,
  clearResponseState,
}: UseVoiceInputOptions) {
  const handleSpeechEndRef = useRef<() => Promise<void>>(async () => {})
  const speechBusyRef = useRef(false)
  const holdToTalkActiveRef = useRef(false)
  const voiceCancelledRef = useRef(false)

  const handleSpeechEnd = useCallback(async () => {
    if (speechBusyRef.current || voiceCancelledRef.current) return
    speechBusyRef.current = true
    try {
      const text = useStore.getState().transcript.trim()
      if (!text) {
        setAppState('idle')
        if (!useStore.getState().lastSpeechError) {
          setLastSpeechError(VOICE_COPY.emptyTranscript)
        }
        return
      }

      setLastSpeechError('')
      await runAgentTurn(text)
    } finally {
      speechBusyRef.current = false
    }
  }, [runAgentTurn, setAppState, setLastSpeechError])

  useEffect(() => {
    handleSpeechEndRef.current = handleSpeechEnd
  }, [handleSpeechEnd])

  useEffect(() => {
    return () => {
      stopAudioPlayback()
      disposeSpeechSession()
    }
  }, [])

  useEffect(() => {
    if (appState !== 'listening') return
    const id = window.setTimeout(() => {
      if (useStore.getState().appState !== 'listening') return
      if (!useStore.getState().lastSpeechError) {
        setLastSpeechError(VOICE_COPY.timeout)
      }
      disposeSpeechSession()
      void handleSpeechEndRef.current()
    }, 14_000)
    return () => window.clearTimeout(id)
  }, [appState, setLastSpeechError])

  const startVoiceInput = useCallback(async () => {
    initAudioContext()
    stopAudioPlayback()
    disposeSpeechSession()
    setTranscript('')
    setBotResponse('')
    clearResponseState()
    voiceCancelledRef.current = false
    setAppState('listening')
    const ok = await startSpeechSession({
      onResult: (text) => useStore.getState().setTranscript(text),
      onError: (code) => {
        useStore.getState().setLastSpeechError(speechErrorMessage(code))
      },
      onEnd: () => {
        if (useStore.getState().appState === 'listening') void handleSpeechEndRef.current()
      },
    })
    setSystemNotice({ level: 'ambient', message: VOICE_COPY.started, autoDismissMs: 1500 })
    if (!ok) setAppState('idle')
  }, [clearResponseState, setAppState, setBotResponse, setSystemNotice, setTranscript])

  const stopVoiceInput = useCallback(() => {
    disposeSpeechSession()
    void handleSpeechEndRef.current()
  }, [])

  const holdToTalkStart = useCallback(() => {
    if (holdToTalkActiveRef.current) return
    holdToTalkActiveRef.current = true
    if (useStore.getState().appState === 'listening') return
    void startVoiceInput()
  }, [startVoiceInput])

  const holdToTalkEnd = useCallback(() => {
    if (!holdToTalkActiveRef.current) return
    holdToTalkActiveRef.current = false
    if (useStore.getState().appState === 'listening') {
      stopVoiceInput()
    }
  }, [stopVoiceInput])

  const submitTextMessage = useCallback(
    (text: string, onSubmitted?: () => void) => {
      const safeText = text.trim()
      if (!safeText) return
      initAudioContext()
      stopAudioPlayback()
      clearResponseState()
      setTranscript(safeText)
      setAppState('idle')
      disposeSpeechSession()
      onSubmitted?.()
      window.requestAnimationFrame(() => {
        void handleSpeechEndRef.current()
      })
    },
    [clearResponseState, setAppState, setTranscript],
  )

  const cancelVoiceInput = useCallback(() => {
    voiceCancelledRef.current = true
    holdToTalkActiveRef.current = false
    setAppState('idle')
    disposeSpeechSession()
    setTranscript('')
    setLastSpeechError('')
  }, [setAppState, setLastSpeechError, setTranscript])

  return {
    holdToTalkStart,
    holdToTalkEnd,
    cancelVoiceInput,
    submitTextMessage,
  }
}
