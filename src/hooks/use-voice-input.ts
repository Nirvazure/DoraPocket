import { useCallback, useEffect, useRef } from 'react'
import {
  disposeSpeechSession,
  initAudioContext,
  startSpeechSession,
  stopAudioPlayback,
} from '@/services/audio'
import {
  ANSWER_BOOK_SELECT_KEY,
  MODE_KEY_ANYWHERE_DOOR,
} from '@/shared/mode-registry'
import type { AppState } from '@/store'
import { useStore } from '@/store'

type RunTurnOptions = {
  answerBookFromPocket?: boolean
  skipPostAnswerPocket?: boolean
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
  const map: Record<string, string> = {
    network: '语音识别依赖浏览器在线服务，网络异常时请改用文字输入。',
    'no-speech': '没有听清语音，请靠近麦克风后再试。',
    'not-allowed': '麦克风权限未开启，请在浏览器地址栏授权。',
    aborted: '语音识别已中断。',
    'audio-capture': '无法访问麦克风，可能被其他应用占用。',
    'service-not-allowed': '系统或浏览器禁止了语音识别服务。',
    'start-failed': '无法启动语音识别，请稍后重试或改用文字输入。',
  }
  return map[code] ?? `语音识别错误：${code}`
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

  const handleSpeechEnd = useCallback(async () => {
    if (speechBusyRef.current) return
    speechBusyRef.current = true
    try {
      const text = useStore.getState().transcript.trim()
      if (!text) {
        setAppState('idle')
        if (!useStore.getState().lastSpeechError) {
          setLastSpeechError('未收到识别文本。你可以直接用底部输入框发送文字。')
        }
        return
      }

      setLastSpeechError('')
      const pocketKey = useStore.getState().selectedGadgetKey
      const skipPostAnswerPocket = pocketKey != null && pocketKey !== MODE_KEY_ANYWHERE_DOOR
      await runAgentTurn(text, {
        answerBookFromPocket: pocketKey === ANSWER_BOOK_SELECT_KEY,
        skipPostAnswerPocket,
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
    const id = window.setTimeout(() => {
      if (useStore.getState().appState !== 'listening') return
      if (!useStore.getState().lastSpeechError) {
        setLastSpeechError('监听超时，已自动结束。你也可以直接使用文字输入。')
      }
      disposeSpeechSession()
      void handleSpeechEndRef.current()
    }, 14_000)
    return () => window.clearTimeout(id)
  }, [appState, setLastSpeechError])

  const startVoiceInput = useCallback(() => {
    initAudioContext()
    stopAudioPlayback()
    disposeSpeechSession()
    setTranscript('')
    setBotResponse('')
    clearResponseState()
    setAppState('listening')
    const ok = startSpeechSession({
      onResult: (text) => useStore.getState().setTranscript(text),
      onError: (code) => {
        useStore.getState().setLastSpeechError(speechErrorMessage(code))
      },
      onEnd: () => {
        if (useStore.getState().appState === 'listening') void handleSpeechEndRef.current()
      },
    })
    setSystemNotice({ level: 'ambient', message: '语音辅助输入已开始', autoDismissMs: 1500 })
    if (!ok) setAppState('idle')
  }, [
    clearResponseState,
    setAppState,
    setBotResponse,
    setSystemNotice,
    setTranscript,
  ])

  const stopVoiceInput = useCallback(() => {
    disposeSpeechSession()
    void handleSpeechEndRef.current()
  }, [])

  const holdToTalkStart = useCallback(() => {
    if (holdToTalkActiveRef.current) return
    holdToTalkActiveRef.current = true
    if (useStore.getState().appState === 'listening') return
    startVoiceInput()
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

  return {
    holdToTalkStart,
    holdToTalkEnd,
    submitTextMessage,
  }
}
