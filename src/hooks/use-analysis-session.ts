import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { playAudioStream, playDoraPocketSfx, stopAudioPlayback } from '@/services/audio'
import { askQwen, type ChatToolPayload } from '@/services/llm'
import { buildTTSAudioUrl } from '@/services/tts'
import { getToolById } from '@/services/tool-registry'
import { getModeByToolId, pickModeCardAfterTurn, type AssistantModeCard } from '@/shared/mode-registry'
import type { AgentUiPayload } from '@/shared/market-types'
import { SYSTEM_NOTICE_COPY } from '@/shared/ui-copy'
import { getMarketContextQueryOptions } from '@/lib/query/market'
import { queryKeys } from '@/lib/query/query-keys'
import type { AppState } from '@/store'

type RunTurnOptions = {
  answerBookFromPocket?: boolean
}

type PocketInventoryItem = {
  toolId: string
}

type UseAnalysisSessionOptions = {
  autoSaveEnabled: boolean
  pocketInventory: PocketInventoryItem[]
  saveChatHistory: (input: {
    userText: string
    assistantText: string
    selectedToolId?: string
  }) => void
  saveToolToPocket: (input: {
    toolId: string
    sourceQuestion?: string
    presetArgs?: Record<string, unknown>
  }) => Promise<unknown>
  setAppState: (state: AppState) => void
  setTranscript: (text: string) => void
  setBotResponse: (text: string) => void
  setLastSpeechError: (message: string) => void
  setSystemNotice: (notice: {
    level: 'task' | 'ambient' | 'critical' | 'silent'
    message: string
    autoDismissMs?: number
  }) => void
  getSelectedGadgetKey: () => string | null
  onPocketGadgetChange: (gadget: AssistantModeCard) => void
}

type AgentTurnReply = {
  text: string
  selectedTool: ChatToolPayload
  uiPayload: AgentUiPayload | null
}

export function useAnalysisSession({
  autoSaveEnabled,
  pocketInventory,
  saveChatHistory,
  saveToolToPocket,
  setAppState,
  setTranscript,
  setBotResponse,
  setLastSpeechError,
  setSystemNotice,
  getSelectedGadgetKey,
  onPocketGadgetChange,
}: UseAnalysisSessionOptions) {
  const queryClient = useQueryClient()
  const pocketReachTimerRef = useRef(0)
  const latestUserPromptRef = useRef('')
  // 当前回合的流式文本缓冲，避免从全局旧值反向拼接。
  const responseBufferRef = useRef('')
  const [selectedToolPayload, setSelectedToolPayload] = useState<ChatToolPayload>(null)
  const [agentUiPayload, setAgentUiPayload] = useState<AgentUiPayload | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null)
  const [autoSaveNotice, setAutoSaveNotice] = useState<{ toolId: string; label: string } | null>(null)

  const finishSpeakingTurn = useCallback(() => {
    setAppState('idle')
    setTranscript('')
    setBotResponse('')
  }, [setAppState, setBotResponse, setTranscript])

  const triggerPocketReveal = useCallback(
    (gadget: AssistantModeCard) => {
      onPocketGadgetChange(gadget)
      void playDoraPocketSfx()
      window.clearTimeout(pocketReachTimerRef.current)
      pocketReachTimerRef.current = window.setTimeout(() => {
        pocketReachTimerRef.current = 0
      }, 1050)
    },
    [onPocketGadgetChange],
  )

  const clearResponseState = useCallback(() => {
    setLastSpeechError('')
    setSelectedToolPayload(null)
    setAgentUiPayload(null)
  }, [setLastSpeechError])

  const handleReplyMeta = useCallback(
    ({
      selectedTool,
      uiPayload,
    }: {
      selectedTool: ChatToolPayload
      uiPayload: AgentUiPayload | null
    }) => {
      setSelectedToolPayload(selectedTool)
      setAgentUiPayload(uiPayload)
    },
    [],
  )

  const handleReplyDelta = useCallback(
    (chunk: string) => {
      responseBufferRef.current += chunk
      setBotResponse(responseBufferRef.current)
    },
    [setBotResponse],
  )

  // 自动沉淀只发生在推荐链路满足 shouldAutoSave 且口袋中尚不存在该工具时。
  const maybeAutoSaveTool = useCallback(
    async (safeText: string, reply: AgentTurnReply) => {
      const toolId = reply.selectedTool?.toolId
      if (!autoSaveEnabled || !reply.uiPayload?.shouldAutoSave || !toolId) return

      const latestPocketInventory =
        queryClient.getQueryData<PocketInventoryItem[]>(queryKeys.pocket.list()) ?? pocketInventory
      const existingPocketItem = latestPocketInventory.find((item) => item.toolId === toolId)
      if (existingPocketItem) return

      await saveToolToPocket({
        toolId,
        sourceQuestion: safeText,
        presetArgs: reply.selectedTool?.args,
      })
      setAutoSaveNotice({
        toolId,
        label: getToolById(toolId)?.name ?? getModeByToolId(toolId)?.title ?? toolId,
      })
      setSystemNotice({
        level: 'task',
        message: SYSTEM_NOTICE_COPY.autoSaved,
        autoDismissMs: 2200,
      })
    },
    [autoSaveEnabled, pocketInventory, queryClient, saveToolToPocket, setSystemNotice],
  )

  // 请求成功后的统一收尾：持久化、口袋联动、自动沉淀、TTS 播放。
  const handleReplySuccess = useCallback(
    async (safeText: string, reply: AgentTurnReply) => {
      setSelectedToolPayload(reply.selectedTool)
      setAgentUiPayload(reply.uiPayload)
      saveChatHistory({
        userText: safeText,
        assistantText: reply.text,
        selectedToolId: reply.selectedTool?.toolId,
      })

      const pocketKey = getSelectedGadgetKey()
      const nextPocketGadget = pickModeCardAfterTurn(pocketKey, reply.selectedTool?.toolId)
      onPocketGadgetChange(nextPocketGadget)
      if (reply.selectedTool?.toolId) {
        triggerPocketReveal(nextPocketGadget)
      }

      await maybeAutoSaveTool(safeText, reply)

      const audioUrl = await buildTTSAudioUrl(reply.text)
      setBotResponse(reply.text)

      if (audioUrl) {
        setAppState('speaking')
        playAudioStream(audioUrl, () => {
          finishSpeakingTurn()
        })
        return
      }

      finishSpeakingTurn()
    },
    [
      finishSpeakingTurn,
      getSelectedGadgetKey,
      maybeAutoSaveTool,
      onPocketGadgetChange,
      saveChatHistory,
      setAppState,
      setBotResponse,
      triggerPocketReveal,
    ],
  )

  // 请求失败后的统一兜底：清空临时态并透出系统提示。
  const handleReplyError = useCallback(
    (error: unknown) => {
      stopAudioPlayback()
      setSelectedToolPayload(null)
      setAgentUiPayload(null)
      setBotResponse('')
      setAppState('idle')
      const message = error instanceof Error ? error.message : SYSTEM_NOTICE_COPY.analysisFailed
      setLastSpeechError(message)
      setSystemNotice({ level: 'critical', message, autoDismissMs: 2800 })
    },
    [setAppState, setBotResponse, setLastSpeechError, setSystemNotice],
  )

  const runAgentTurn = useCallback(
    async (text: string, options?: RunTurnOptions) => {
      const safeText = text.trim()
      if (!safeText) return

      try {
        // 启动新回合前先重置音频与流式缓冲，避免上一次结果残留。
        stopAudioPlayback()
        responseBufferRef.current = ''
        setLastSpeechError('')
        setBotResponse('')
        setAppState('thinking')
        latestUserPromptRef.current = safeText
        setCurrentPrompt(safeText)

        // 每轮都基于最新市场上下文发起请求，确保推荐与口袋状态一致。
        const marketContext = await queryClient.fetchQuery(getMarketContextQueryOptions('applied'))
        const reply = await askQwen(safeText, {
          answerBookFromPocket: options?.answerBookFromPocket === true,
          marketContext,
          onMeta: handleReplyMeta,
          onDelta: handleReplyDelta,
        })

        await handleReplySuccess(safeText, reply)
      } catch (error) {
        handleReplyError(error)
      }
    },
    [
      handleReplyDelta,
      handleReplyError,
      handleReplyMeta,
      handleReplySuccess,
      queryClient,
      setAppState,
      setBotResponse,
      setLastSpeechError,
    ],
  )

  useEffect(() => {
    return () => {
      window.clearTimeout(pocketReachTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!autoSaveNotice) return
    const id = window.setTimeout(() => setAutoSaveNotice(null), 3600)
    return () => window.clearTimeout(id)
  }, [autoSaveNotice])

  return {
    selectedToolPayload,
    agentUiPayload,
    currentPrompt,
    autoSaveNotice,
    latestUserPromptRef,
    setAutoSaveNotice,
    setSelectedToolPayload,
    setAgentUiPayload,
    clearResponseState,
    runAgentTurn,
  }
}
