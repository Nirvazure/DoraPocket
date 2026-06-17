import type {
  AgentCandidate,
  AgentTaskFrame,
  AgentUiPayload,
  MarketContext,
} from '@/shared/market-types'
import type { ExplanationMode } from '@/shared/user-settings'

export type PocketIntent = 'chat' | 'discover'

export type PocketSelectedTool = {
  toolId: string
  args: Record<string, unknown>
} | null

export type PocketState = {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  intent: PocketIntent
  task_frame: AgentTaskFrame
  candidate_tools: AgentCandidate[]
  selected_tool: PocketSelectedTool
  selection_reason: string
  ui_payload: AgentUiPayload
  final_text: string
  market_context: MarketContext
  explanation_mode: ExplanationMode
}

export type CreateInitialStateOptions = {
  anchorPrompt?: string
  priorMessages?: Array<{ role: 'user' | 'assistant'; content: string }>
}

function createEmptyTaskFrame(goal: string): AgentTaskFrame {
  return {
    goal,
    mode: 'discover',
    missingInputs: [],
    role: null,
    scenario: goal,
    constraints: [],
    budgetPreference: null,
    authPreference: null,
    languagePreference: null,
    evidenceRequirement: null,
    platformPreference: null,
    urgency: 'unspecified',
    confidenceDrivers: [],
  }
}

export function createInitialState(
  input: string,
  marketContext: MarketContext,
  explanationMode: ExplanationMode,
  options?: CreateInitialStateOptions,
): PocketState {
  const goal = options?.anchorPrompt ?? input
  const priorMessages = options?.priorMessages ?? []
  const messages = [
    ...priorMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: input },
  ]

  return {
    messages,
    intent: 'discover',
    task_frame: createEmptyTaskFrame(goal),
    candidate_tools: [],
    selected_tool: null,
    selection_reason: '',
    ui_payload: {
      stageLabel: '任务分析',
      stageTrail: ['识别任务', '任务分析'],
      taskFrame: createEmptyTaskFrame(goal),
      candidates: [],
      selectionReason: '',
      selectionSignals: [],
      preferenceSignals: [],
      recommendedActions: [],
    },
    final_text: '',
    market_context: marketContext,
    explanation_mode: explanationMode,
  }
}
