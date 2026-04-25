import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { Keyboard, Mic, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { Avatar } from './components/Avatar'
import { ListeningHud } from './components/listening-hud'
import { SceneLights } from './components/scene-lights'
import { TranscriptBarrage } from './components/transcript-barrage'
import { Button } from '@/components/ui/button'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { RightStatusShowcase } from '@/components/right-status-showcase'
import { useStore } from './store'
import {
  disposeSpeechSession,
  initAudioContext,
  playAudioStream,
  playDoraPocketSfx,
  startSpeechSession,
  stopAudioPlayback,
} from './services/audio'
import { askQwen, type ChatToolPayload } from './services/llm'
import { fetchTTSAudio } from './services/tts'
import { saveChatHistoryEntry } from '@/services/chat-history'
import { buildMarketContext, recordToolSubscribed, setToolSubscription } from '@/services/market-storage'
import { getToolById } from '@/services/tool-registry'
import {
  ANSWER_BOOK_SELECT_KEY,
  MODE_KEY_ANYWHERE_DOOR,
  ASSISTANT_MODES,
  modeImageSrc,
  getModeByToolId,
  pickModeCardAfterTurn,
  type AssistantModeCard,
} from '@/shared/mode-registry'
import { PocketGadgetModal } from './components/pocket-gadget-modal'
import { cn } from '@/lib/utils'
import { DiscoveryWorkspace } from '@/components/discovery-workspace'
import type { AgentUiPayload } from '@/shared/market-types'

type InputMode = 'text' | 'voice'
type ToolDialMode = 'quick' | 'all'
type RunTurnOptions = {
  answerBookFromPocket?: boolean
  skipPostAnswerPocket?: boolean
}

const AUTO_SAVE_POCKET_STORAGE_KEY = 'dp-pocket-autosave-enabled-v1'
const FONT_PRESET_STORAGE_KEY = 'dorapocket-font-preset'
const PROMPT_SUGGESTIONS = [
  '帮我找一个最好用的 PDF 压缩工具',
  '推荐适合查资料并带引用的 AI 搜索工具',
  '我想做 GitHub 主页 README，给我靠谱工具',
]

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

export default function App() {
  const {
    appState,
    setAppState,
    transcript,
    setTranscript,
    setBotResponse,
    setLastSpeechError,
    systemNotice,
    setSystemNotice,
    clearSystemNotice,
    selectedGadgetKey,
    setSelectedGadgetKey,
    saveToolToPocket,
    removeToolFromPocket,
    pocketInventory,
    hydratePocketInventory,
  } = useStore()

  const handleSpeechEndRef = useRef<() => Promise<void>>(async () => {})
  const speechBusyRef = useRef(false)
  const pocketReachTimerRef = useRef(0)
  const latestUserPromptRef = useRef('')
  const holdToTalkActiveRef = useRef(false)
  const listeningStartRef = useRef<number | null>(null)

  const [inputMode, setInputMode] = useState<InputMode>('text')
  const [textFallback, setTextFallback] = useState('')
  const [busyHint, setBusyHint] = useState('')
  const [pocketModalOpen, setPocketModalOpen] = useState(false)
  const [pocketGadget, setPocketGadget] = useState<AssistantModeCard | null>(null)
  const [selectedToolPayload, setSelectedToolPayload] = useState<ChatToolPayload>(null)
  const [agentUiPayload, setAgentUiPayload] = useState<AgentUiPayload | null>(null)
  const [pocketReachOpen, setPocketReachOpen] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null)
  const [autoSaveNotice, setAutoSaveNotice] = useState<{ toolId: string; label: string } | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      return window.localStorage.getItem(AUTO_SAVE_POCKET_STORAGE_KEY) !== '0'
    } catch {
      return true
    }
  })
  const [toolDialOpen, setToolDialOpen] = useState(false)
  const [toolDialMode, setToolDialMode] = useState<ToolDialMode>('quick')
  const [starterDraftReady, setStarterDraftReady] = useState(false)
  const toolDialRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    document.documentElement.dataset.fontPreset = 'c'
    try {
      localStorage.setItem(FONT_PRESET_STORAGE_KEY, 'c')
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    hydratePocketInventory()
  }, [hydratePocketInventory])

  useEffect(() => {
    if (selectedGadgetKey == null) {
      setSelectedGadgetKey(MODE_KEY_ANYWHERE_DOOR)
    }
  }, [selectedGadgetKey, setSelectedGadgetKey])

  useEffect(() => {
    if (!toolDialOpen) return
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!toolDialRef.current?.contains(target)) {
        setToolDialOpen(false)
        setToolDialMode('quick')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [toolDialOpen])

  const finishSpeakingTurn = useCallback(
    (_skipPocket?: boolean) => {
      void _skipPocket
      setAppState('idle')
      setTranscript('')
      setBotResponse('')
    },
    [setAppState, setTranscript, setBotResponse],
  )

  const triggerPocketReveal = useCallback(
    (gadget: AssistantModeCard) => {
      setPocketGadget(gadget)
      setPocketReachOpen(true)
      void playDoraPocketSfx()
      window.clearTimeout(pocketReachTimerRef.current)
      pocketReachTimerRef.current = window.setTimeout(() => {
        pocketReachTimerRef.current = 0
        setPocketReachOpen(false)
      }, 1050)
    },
    [],
  )

  const runAgentTurn = useCallback(
    async (text: string, options?: RunTurnOptions) => {
      const safeText = text.trim()
      if (!safeText) return

      stopAudioPlayback()
      setLastSpeechError('')
      setBotResponse('')
      setAppState('thinking')
      latestUserPromptRef.current = safeText
      setCurrentPrompt(safeText)
      const marketContext = buildMarketContext(useStore.getState().pocketInventory)
      const reply = await askQwen(safeText, {
        answerBookFromPocket: options?.answerBookFromPocket === true,
        marketContext,
        onMeta: ({ selectedTool, uiPayload }) => {
          setSelectedToolPayload(selectedTool)
          setAgentUiPayload(uiPayload)
        },
        onDelta: (chunk) => {
          setBotResponse(`${useStore.getState().botResponse}${chunk}`)
        },
      })
      const answer = reply.text
      setSelectedToolPayload(reply.selectedTool)
      setAgentUiPayload(reply.uiPayload)
      saveChatHistoryEntry({
        userText: safeText,
        assistantText: answer,
        selectedToolId: reply.selectedTool?.toolId,
      })
      const pocketKey = useStore.getState().selectedGadgetKey
      const nextPocketGadget = pickModeCardAfterTurn(pocketKey, reply.selectedTool?.toolId)
      setPocketGadget(nextPocketGadget)
      if (reply.selectedTool?.toolId) {
        triggerPocketReveal(nextPocketGadget)
      }
      const existingPocketItem = useStore.getState().pocketInventory.find((item) => item.toolId === reply.selectedTool?.toolId)
      if (autoSaveEnabled && reply.uiPayload?.shouldAutoSave && reply.selectedTool?.toolId && !existingPocketItem) {
        saveToolToPocket(reply.selectedTool.toolId, safeText, reply.selectedTool.args)
        setAutoSaveNotice({
          toolId: reply.selectedTool.toolId,
          label: getToolById(reply.selectedTool.toolId)?.name ?? getModeByToolId(reply.selectedTool.toolId)?.title ?? reply.selectedTool.toolId,
        })
        setSystemNotice({ level: 'task', message: '已沉淀为可复用入口', autoDismissMs: 2200 })
      }

      const audioUrl = await fetchTTSAudio(answer)
      setBotResponse(answer)

      if (audioUrl) {
        setAppState('speaking')
        playAudioStream(audioUrl, () => {
          finishSpeakingTurn(options?.skipPostAnswerPocket === true)
        })
      } else {
        finishSpeakingTurn(options?.skipPostAnswerPocket === true)
      }
    },
    [autoSaveEnabled, finishSpeakingTurn, saveToolToPocket, setAppState, setBotResponse, setLastSpeechError, setSystemNotice, triggerPocketReveal],
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

  useEffect(() => {
    if (!systemNotice?.autoDismissMs) return
    const id = window.setTimeout(() => clearSystemNotice(), systemNotice.autoDismissMs)
    return () => window.clearTimeout(id)
  }, [clearSystemNotice, systemNotice])

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
    setSelectedToolPayload(null)
    setAgentUiPayload(null)
    setLastSpeechError('')
    setAppState('listening')
    listeningStartRef.current = performance.now()
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
  }, [setAppState, setTranscript, setBotResponse, setLastSpeechError, setSystemNotice])

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

  const handleDraftTask = useCallback((draft: string) => {
    setTextFallback(draft)
    setStarterDraftReady(Boolean(draft.trim()))
  }, [])

  const submitTextMessage = () => {
    const text = textFallback.trim()
    if (!text) return
    initAudioContext()
    stopAudioPlayback()
    setLastSpeechError('')
    setSelectedToolPayload(null)
    setAgentUiPayload(null)
    setTextFallback('')
    setStarterDraftReady(false)
    setTranscript(text)
    setAppState('idle')
    listeningStartRef.current = null
    disposeSpeechSession()
    window.requestAnimationFrame(() => {
      void handleSpeechEndRef.current()
    })
  }

  const rootCursor = appState === 'thinking' || appState === 'speaking' ? 'cursor-wait' : 'cursor-default'

  const canSendText = textFallback.trim().length > 0
  const toolBasedGadget = getModeByToolId(selectedToolPayload?.toolId)
  const quickDialGadgets = toolBasedGadget ? [toolBasedGadget, ...ASSISTANT_MODES].slice(0, 4) : ASSISTANT_MODES.slice(0, 4)
  const dialGadgets = toolDialMode === 'quick' ? quickDialGadgets : ASSISTANT_MODES
  const randomPromptPlaceholder = `试试：${PROMPT_SUGGESTIONS[0]}`
  const pocketStats = useMemo(() => {
    const archived = pocketInventory.filter((item) => item.archived).length
    const pinned = pocketInventory.filter((item) => item.pinned).length
    const reusable = pocketInventory.filter((item) => item.presetArgs && Object.keys(item.presetArgs).length > 0).length
    return {
      total: pocketInventory.length,
      archived,
      pinned,
      reusable,
    }
  }, [pocketInventory])
  const heroMetricCards = useMemo(
    () => [
      { label: '口袋资产', value: pocketStats.total, hint: '可复用入口' },
      { label: '置顶工具', value: pocketStats.pinned, hint: '高频资产' },
      { label: '可复用入口', value: pocketStats.reusable, hint: '一键再调用' },
      { label: '已归档', value: pocketStats.archived, hint: '低频保留' },
    ],
    [pocketStats],
  )

  const handleSelectDialGadget = (gadget: AssistantModeCard) => {
    if (!gadget.selectKey && gadget.toolId) {
      setPocketGadget(gadget)
      setPocketModalOpen(true)
      setToolDialOpen(false)
      setToolDialMode('quick')
      return
    }
    setSelectedGadgetKey(gadget.selectKey ?? null)
    setToolDialOpen(false)
    setToolDialMode('quick')
  }

  return (
    <PageShell
      className={cn('touch-manipulation', rootCursor)}
      contentClassName="grid min-h-0 grid-cols-1 gap-4 pb-6 lg:h-[calc(100dvh-6.9rem)] lg:grid-cols-[minmax(0,1.45fr)_minmax(21rem,0.72fr)] lg:items-stretch lg:overflow-hidden lg:pb-3"
      header={
        <UnifiedTopBar
          title="DoraPocket · 分析页"
          subtitle="不只是聊天，而是替你找全网最好用的工具，并把高价值能力沉淀进口袋。"
          statusSlot={
            systemNotice ? (
              <span className="rounded-full border border-border/60 bg-white px-3 py-1 text-[11px] font-semibold text-foreground/75">
                {systemNotice.message}
              </span>
            ) : null
          }
          rightSlot={
            <div className="flex items-center gap-2">
              <TopNavSwitch current="analysis" />
              <ProfileEntryPill />
            </div>
          }
        />
      }
    >
      <PocketGadgetModal
        open={pocketModalOpen}
        gadget={pocketGadget}
        onClose={() => setPocketModalOpen(false)}
        onOpenTool={(toolId) => useStore.getState().markToolUsed(toolId)}
        onSaveToPocket={(gadget) => {
          if (!gadget.toolId) return
          const presetArgs =
            selectedToolPayload?.toolId === gadget.toolId && selectedToolPayload.args
              ? selectedToolPayload.args
              : undefined
          saveToolToPocket(gadget.toolId, latestUserPromptRef.current || undefined, presetArgs)
        }}
      />
      {transcript.trim() ? <TranscriptBarrage text={transcript} /> : null}
      {appState === 'listening' ? <ListeningHud /> : null}
      <div className="min-h-0 h-full">
        <DiscoveryWorkspace
            title="DoraPocket"
            description="不只是聊天，而是替你找全网最好用的工具，并把高价值能力沉淀进口袋。"
            heroMetricCards={heroMetricCards}
            currentPrompt={currentPrompt}
            appState={appState}
            pocketRevealOpen={pocketReachOpen}
            agentPayload={agentUiPayload}
            selectedToolPayload={selectedToolPayload}
            pocketInventory={pocketInventory}
            busyHint={busyHint}
            autoSaveEnabled={autoSaveEnabled}
            autoSaveNotice={autoSaveNotice}
            onToolEvent={(event) => {
              if (event.type === 'tool_requires_input') {
                setBusyHint(event.message ?? '这个工具还需要补充信息。')
                setSystemNotice({ level: 'task', message: '需要补充条件后再执行', autoDismissMs: 2200 })
                return
              }
              if (event.type === 'tool_rendered') {
                setBusyHint('')
                clearSystemNotice()
              }
            }}
            onOpenPocket={() => {
              setAutoSaveNotice(null)
              window.location.href = '/pocket'
            }}
            onSaveCandidate={(toolId) => {
              saveToolToPocket(toolId, latestUserPromptRef.current || undefined)
              setSystemNotice({ level: 'task', message: '已沉淀为下次可复用入口', autoDismissMs: 2200 })
            }}
            onSubscribeCandidate={(toolId) => {
              recordToolSubscribed(toolId)
              setToolSubscription(toolId, true)
            }}
            onLaunchCandidate={(toolId) => {
              const url = getToolById(toolId)?.url
              if (!url) return
              useStore.getState().markToolUsed(toolId)
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
            onUndoAutoSave={() => {
              if (!autoSaveNotice) return
              removeToolFromPocket(autoSaveNotice.toolId)
              setAutoSaveNotice(null)
            }}
            onDisableAutoSave={() => {
              setAutoSaveEnabled(false)
              try {
                window.localStorage.setItem(AUTO_SAVE_POCKET_STORAGE_KEY, '0')
              } catch {
                /* ignore */
              }
              setAutoSaveNotice(null)
            }}
            onEnableAutoSave={() => {
              setAutoSaveEnabled(true)
              try {
                window.localStorage.setItem(AUTO_SAVE_POCKET_STORAGE_KEY, '1')
              } catch {
                /* ignore */
              }
            }}
            onDraftTask={handleDraftTask}
        />
      </div>

      <section ref={toolDialRef} className="pointer-events-auto relative flex min-h-[34rem] h-full flex-col overflow-hidden rounded-[2rem] border border-white/80 bg-white/62 shadow-xl shadow-slate-900/8 backdrop-blur-xl xl:min-h-0">
            <div className="absolute inset-x-0 top-0 z-[1] h-20 rounded-t-[2rem] bg-white/92" aria-hidden />
            <div className="relative z-10 shrink-0 border-b border-border/45 bg-white/90 px-5 py-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Dora Stage / Live Status</p>
                <RightStatusShowcase appState={appState} />
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              <div className="absolute inset-0 z-0 opacity-85">
                <Canvas
                  camera={{ position: [0, 0.22, 4.35], fov: 42 }}
                  gl={{ alpha: true, antialias: true }}
                  onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
                >
                  <SceneLights />
                  <Avatar />
                  <ContactShadows position={[0, -0.87, 0]} opacity={0.32} scale={8.8} blur={2.6} far={4} />
                  <OrbitControls
                    enableZoom={true}
                    enablePan={false}
                    enableRotate={true}
                    minDistance={3.7}
                    maxDistance={5.1}
                    zoomSpeed={0.7}
                    target={[0, 0.22, 0]}
                    minPolarAngle={1.15}
                    maxPolarAngle={1.4}
                    minAzimuthAngle={-0.45}
                    maxAzimuthAngle={0.45}
                  />
                </Canvas>
              </div>
              <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/64 via-white/34 to-white/72" aria-hidden />
              <div className="relative z-10 min-h-0 flex-1 pointer-events-none" />
              <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-11 rounded-full border-white/85 bg-white/94 p-0 text-xs shadow-lg shadow-slate-900/10 backdrop-blur-md hover:bg-white"
                    onClick={() => {
                      setToolDialOpen((open) => !open)
                      setToolDialMode('quick')
                    }}
                    aria-expanded={toolDialOpen}
                    aria-label="打开内置道具拨号盘"
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  {toolDialOpen ? (
                    <div role="menu" aria-label="内置工具拨号盘" className="absolute bottom-14 right-0 z-10 w-56 rounded-2xl border border-white/85 bg-white/95 p-2 shadow-md">
                      <div className="grid grid-cols-1 gap-1.5">
                        {dialGadgets.map((gadget) => {
                          const selected = selectedGadgetKey != null && gadget.selectKey === selectedGadgetKey
                          return (
                            <button
                              key={gadget.title}
                              role="menuitem"
                              type="button"
                              className={cn(
                                'flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold',
                                selected
                                  ? 'border-primary bg-primary/12 text-primary'
                                  : 'border-white/85 bg-white text-foreground hover:bg-slate-50',
                              )}
                              onClick={() => handleSelectDialGadget(gadget)}
                            >
                              <Image src={modeImageSrc(gadget)} alt="" width={16} height={16} className="h-4 w-4 rounded-full object-contain" />
                              <span className="truncate">{gadget.title}</span>
                            </button>
                          )
                        })}
                        <button
                          role="menuitem"
                          type="button"
                          className="rounded-full border border-white/85 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-slate-50"
                          onClick={() => setToolDialMode((value) => (value === 'quick' ? 'all' : 'quick'))}
                        >
                          {toolDialMode === 'quick' ? '更多道具' : '收起道具'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div data-dorapocket-textbox data-dorapocket-ui className="relative z-10 shrink-0 pointer-events-auto border-t border-white/60 bg-white/78 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
              <div className="space-y-2">
                {starterDraftReady && textFallback.trim() ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-primary/20 bg-primary/[0.06] px-3 py-2 text-xs text-foreground shadow-sm">
                    <span className="font-semibold text-foreground/80">已填入任务草稿，可以直接开始裁决，也可以继续修改。</span>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" className="h-8 rounded-full px-3 text-[11px] font-bold" onClick={submitTextMessage}>
                        直接开始裁决
                      </Button>
                      <button
                        type="button"
                        className="rounded-full px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-white/70 hover:text-foreground"
                        onClick={() => setStarterDraftReady(false)}
                      >
                        关闭
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/92 text-foreground shadow-sm transition-colors hover:bg-white"
                    onClick={() => setInputMode((mode) => (mode === 'text' ? 'voice' : 'text'))}
                    aria-label={inputMode === 'text' ? '切换到语音输入' : '切换到文字输入'}
                    title={inputMode === 'text' ? '切换到语音输入' : '切换到文字输入'}
                  >
                    {inputMode === 'text' ? <Mic className="h-4 w-4" /> : <Keyboard className="h-4 w-4" />}
                  </button>

                  {inputMode === 'text' ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/80 bg-white/95 p-1.5 shadow-sm backdrop-blur-md">
                      <input
                        type="text"
                        value={textFallback}
                        onChange={(e) => {
                          setTextFallback(e.target.value)
                          if (!e.target.value.trim()) setStarterDraftReady(false)
                        }}
                        placeholder={randomPromptPlaceholder}
                        className="min-w-0 flex-1 rounded-full border border-border/70 bg-transparent px-3 py-2 font-sans text-sm text-foreground outline-none ring-primary/30 placeholder:text-muted-foreground focus-visible:ring-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && canSendText) submitTextMessage()
                        }}
                      />
                      <Button
                        type="button"
                        disabled={!canSendText}
                        className="h-10 shrink-0 rounded-full border-2 border-primary/25 px-4 font-sans text-xs font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
                        onClick={submitTextMessage}
                      >
                        发送
                      </Button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={cn(
                          'flex h-11 min-w-0 flex-1 items-center justify-center rounded-2xl border px-4 font-sans text-sm font-semibold backdrop-blur-md transition-colors',
                          appState === 'listening'
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-white/70 bg-white/90 text-foreground hover:bg-white',
                        )}
                        onPointerDown={holdToTalkStart}
                        onPointerUp={holdToTalkEnd}
                        onPointerLeave={holdToTalkEnd}
                        onPointerCancel={holdToTalkEnd}
                      >
                        {appState === 'listening' ? '松开结束' : '按住说话'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
      </section>
    </PageShell>
  )
}
