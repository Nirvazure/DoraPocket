import type { AgentCandidate, AgentTaskFrame, AgentUiPayload, MarketContext } from '@/shared/market-types'

export type PocketIntent =
  | 'chat'
  | 'discover'
  | 'weather'
  | 'time'
  | 'exchange'
  | 'air_quality'
  | 'web_summary'
  | 'answer_book'

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
  tool_result: string
  ui_payload: AgentUiPayload
  final_text: string
  answerBookFromPocket: boolean
  market_context: MarketContext
}

export function createInitialState(
  input: string,
  answerBookFromPocket: boolean,
  marketContext: MarketContext,
): PocketState {
  return {
    messages: [{ role: 'user', content: input }],
    intent: 'chat',
    task_frame: {
      goal: input,
      mode: answerBookFromPocket ? 'answer_book' : 'chat',
      missingInputs: [],
    },
    candidate_tools: [],
    selected_tool: null,
    selection_reason: '',
    tool_result: '',
    ui_payload: {
      stageLabel: answerBookFromPocket ? '答案之书' : '任务分析',
      stageTrail: answerBookFromPocket ? ['识别任务', '短答模式'] : ['识别任务', '任务分析'],
      taskFrame: {
        goal: input,
        mode: answerBookFromPocket ? 'answer_book' : 'chat',
        missingInputs: [],
      },
      candidates: [],
      selectionReason: '',
      selectionSignals: [],
      preferenceSignals: [],
      recommendedActions: [],
      shouldAutoSave: false,
    },
    final_text: '',
    answerBookFromPocket,
    market_context: marketContext,
  }
}
