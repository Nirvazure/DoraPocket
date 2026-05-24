import { useCallback, useEffect, useRef } from 'react'
import {
  disposeSpeechSession,
  initAudioContext,
  startSpeechSession,
  stopAudioPlayback,
} from '@/lib/client/audio'
import { ANSWER_BOOK_SELECT_KEY } from '@/shared/mode-registry'
import { VOICE_COPY } from '@/shared/ui-copy'
import type { AppState } from '@/store'
import { useStore } from '@/store'

type RunTurnOptions = {
  answerBookFromPocket?: boolean
}

type UseVoiceInputOptions = {
  appState: AppState
  runAgentTurn: (text: string, options?: RunTurnOptions) => Promise<void>
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

  // 语音会话结束后统一走这里：空文本兜底，有文本则直接进入主回合提交。
  const handleSpeechEnd = useCallback(async () => {
    if (speechBusyRef.current) return
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
      const pocketKey = useStore.getState().selectedGadgetKey
      await runAgentTurn(text, {
        answerBookFromPocket: pocketKey === ANSWER_BOOK_SELECT_KEY,
      })
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
    // 监听超时后主动结束录音，并复用统一的 speech end 提交流程。
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

  // 启动语音会话前先清空文本、响应和错误，避免和上一次输入串线。
  const startVoiceInput = useCallback(async () => {
    initAudioContext()
    stopAudioPlayback()
    disposeSpeechSession()
    setTranscript('')
    setBotResponse('')
    clearResponseState()
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

  // 按住说话模式只负责控制会话生命周期，不直接处理识别结果。
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

  // 文本回退最终复用同一套 speech end 逻辑，确保文本 / 语音入口行为一致。
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

  return {
    holdToTalkStart,
    holdToTalkEnd,
    submitTextMessage,
  }
}
