import { create } from 'zustand'
import { IDLE_ANALYSIS_FLOW, type AnalysisFlow } from '@/app/analyse/_domain/analysis-stage-content'
import { createClientId } from '@/lib/id'
import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market/market-types'
import type {
  ProgressStage,
  ClarificationSession,
} from '@/shared/discovery/clarification-session-types'

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
  clarificationSession: ClarificationSession | null
  currentPrompt: string | null
  progressStage: ProgressStage | null
  selectedToolPayload: ChatToolPayload
  agentUiPayload: AgentUiPayload | null
  recommendationSessionId: string | null

  beginAgentTurn: () => AgentTurnHandle
  isAgentTurnActive: (turnId: number) => boolean
  setAnalysisFlow: (flow: AnalysisFlow) => void
  setClarificationSession: (
    session:
      | ClarificationSession
      | null
      | ((prev: ClarificationSession | null) => ClarificationSession | null),
  ) => void
  setCurrentPrompt: (prompt: string | null) => void
  setProgressStage: (stage: ProgressStage | null) => void
  setSelectedToolPayload: (payload: ChatToolPayload) => void
  setAgentUiPayload: (payload: AgentUiPayload | null) => void
  setRecommendationSessionId: (id: string | null) => void
  resetAgentResponse: () => void
  cancelActiveAgentTurn: () => void
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
  clarificationSession: null,
  currentPrompt: null,
  progressStage: null,
  selectedToolPayload: null,
  agentUiPayload: null,
  recommendationSessionId: null,

  beginAgentTurn: () => {
    chatAbortController?.abort()
    chatAbortController = new AbortController()
    const turnId = get().agentTurnId + 1
    set({ agentTurnId: turnId })
    return { turnId, signal: chatAbortController.signal }
  },

  isAgentTurnActive: (turnId) => get().agentTurnId === turnId,

  setAnalysisFlow: (flow) => set({ analysisFlow: flow }),
  setClarificationSession: (session) =>
    set((state) => ({
      clarificationSession:
        typeof session === 'function' ? session(state.clarificationSession) : session,
    })),
  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
  setProgressStage: (stage) => set({ progressStage: stage }),
  setSelectedToolPayload: (payload) => set({ selectedToolPayload: payload }),
  setAgentUiPayload: (payload) => set({ agentUiPayload: payload }),
  setRecommendationSessionId: (id) => set({ recommendationSessionId: id }),
  resetAgentResponse: () =>
    set({
      selectedToolPayload: null,
      agentUiPayload: null,
      recommendationSessionId: null,
      botResponse: '',
    }),

  cancelActiveAgentTurn: () => {
    chatAbortController?.abort()
    chatAbortController = null
    set({ agentTurnId: get().agentTurnId + 1 })
  },
}))

export function mergeClarificationIntoAnalysisFlow(
  flow: AnalysisFlow,
  clarification: ClarificationSession | null,
): AnalysisFlow {
  if (clarification) return { ...flow, clarification }
  if (!flow.clarification) return flow
  return { phase: flow.phase, beat: flow.beat }
}
