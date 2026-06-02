import { create } from 'zustand'
import {
  IDLE_ANALYSIS_FLOW,
  type AnalysisFlow,
} from '@/components/discovery/analysis-stage-content'
import { createClientId } from '@/lib/id'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market-types'
import type { ProgressStage, Step2Session } from '@/shared/step2-session-types'

export type AppState = 'idle' | 'listening' | 'thinking' | 'speaking'
export type SystemNoticeLevel = 'critical' | 'task' | 'ambient' | 'silent'

export type SystemNotice = {
  id: string
  level: SystemNoticeLevel
  message: string
  createdAt: number
  autoDismissMs?: number
}

type AgentTurnHandle = {
  turnId: number
  signal: AbortSignal
}

let chatAbortController: AbortController | null = null

interface DoraStore {
  appState: AppState
  setAppState: (state: AppState) => void
  transcript: string
  setTranscript: (text: string) => void
  botResponse: string
  setBotResponse: (text: string) => void
  lastSpeechError: string
  setLastSpeechError: (msg: string) => void
  systemNotice: SystemNotice | null
  setSystemNotice: (notice: Omit<SystemNotice, 'id' | 'createdAt'> | null) => void
  clearSystemNotice: () => void
  agentTurnId: number
  analysisFlow: AnalysisFlow
  step2Session: Step2Session | null
  currentPrompt: string | null
  progressStage: ProgressStage | null
  selectedToolPayload: ChatToolPayload
  agentUiPayload: AgentUiPayload | null

  beginAgentTurn: () => AgentTurnHandle
  isAgentTurnActive: (turnId: number) => boolean
  setAnalysisFlow: (flow: AnalysisFlow) => void
  setStep2Session: (
    session: Step2Session | null | ((prev: Step2Session | null) => Step2Session | null),
  ) => void
  setCurrentPrompt: (prompt: string | null) => void
  setProgressStage: (stage: ProgressStage | null) => void
  setSelectedToolPayload: (payload: ChatToolPayload) => void
  setAgentUiPayload: (payload: AgentUiPayload | null) => void
  resetAgentResponse: () => void
}

export const useStore = create<DoraStore>((set, get) => ({
  appState: 'idle',
  setAppState: (state) => set({ appState: state }),
  transcript: '',
  setTranscript: (text) => set({ transcript: text }),
  botResponse: '',
  setBotResponse: (text) => set({ botResponse: text }),
  lastSpeechError: '',
  setLastSpeechError: (msg) => set({ lastSpeechError: msg }),
  systemNotice: null,
  setSystemNotice: (notice) =>
    set({
      systemNotice: notice
        ? {
            ...notice,
            id: createClientId('notice'),
            createdAt: Date.now(),
          }
        : null,
    }),
  clearSystemNotice: () => set({ systemNotice: null }),
  agentTurnId: 0,
  analysisFlow: IDLE_ANALYSIS_FLOW,
  step2Session: null,
  currentPrompt: null,
  progressStage: null,
  selectedToolPayload: null,
  agentUiPayload: null,

  beginAgentTurn: () => {
    chatAbortController?.abort()
    chatAbortController = new AbortController()
    const turnId = get().agentTurnId + 1
    set({ agentTurnId: turnId })
    return { turnId, signal: chatAbortController.signal }
  },

  isAgentTurnActive: (turnId) => get().agentTurnId === turnId,

  setAnalysisFlow: (flow) => set({ analysisFlow: flow }),
  setStep2Session: (session) =>
    set((state) => ({
      step2Session: typeof session === 'function' ? session(state.step2Session) : session,
    })),
  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
  setProgressStage: (stage) => set({ progressStage: stage }),
  setSelectedToolPayload: (payload) => set({ selectedToolPayload: payload }),
  setAgentUiPayload: (payload) => set({ agentUiPayload: payload }),
  resetAgentResponse: () =>
    set({
      selectedToolPayload: null,
      agentUiPayload: null,
      botResponse: '',
    }),
}))

export function mergeStep2IntoAnalysisFlow(
  flow: AnalysisFlow,
  step2: Step2Session | null,
): AnalysisFlow {
  if (step2) return { ...flow, step2 }
  if (!flow.step2) return flow
  return { phase: flow.phase, beat: flow.beat }
}
