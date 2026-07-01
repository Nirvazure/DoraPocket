import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import type { AgentUiPayload, MarketContext } from '@/shared/market/market-types'
import type {
  ProgressStage,
  ClarificationDoneStatus,
} from '@/shared/discovery/clarification-session-types'
import type { ExplanationMode } from '@/shared/user/user-settings'
import { buildClarifyQuestion, resolveClarifyOutcome } from '@/server/agent/clarify'
import { resolveQuickReplies } from '@/server/agent/quick-replies'
import { createInitialState, type PocketSelectedTool, type PocketState } from '@/server/agent/state'
import { DORA_PROMPT, invokeModel } from '@/server/agent/model'
import {
  buildAgentUiPayload,
  buildRankedCandidates,
  defaultSelectionReason,
} from '@/server/agent/ui-payload'
import { chunkResponseText } from '@/server/agent/stream'
import { buildDiscoveryResponsePrompt } from '@/server/agent/prompts'
import { buildTaskFrame } from '@/server/agent/task-frame'

const PocketStateAnnotation = Annotation.Root({
  messages: Annotation<PocketState['messages']>(),
  intent: Annotation<PocketState['intent']>(),
  task_frame: Annotation<PocketState['task_frame']>(),
  candidate_tools: Annotation<PocketState['candidate_tools']>(),
  selected_tool: Annotation<PocketState['selected_tool']>(),
  selection_reason: Annotation<PocketState['selection_reason']>(),
  ui_payload: Annotation<PocketState['ui_payload']>(),
  final_text: Annotation<PocketState['final_text']>(),
  market_context: Annotation<PocketState['market_context']>(),
  explanation_mode: Annotation<PocketState['explanation_mode']>(),
})

const classifierNode = async (state: PocketState): Promise<Partial<PocketState>> => {
  const userText = state.messages[state.messages.length - 1]?.content ?? ''
  const taskFrame = buildTaskFrame(userText)
  const {
    candidates,
    topTool,
    primaryCandidate,
    selectionReason: judgedSelectionReason,
    recallSummary,
  } = await buildRankedCandidates(userText, state.market_context, taskFrame)

  const selectedTool: PocketSelectedTool =
    topTool && primaryCandidate?.candidateType !== 'external_suggestion'
      ? { toolId: topTool.id, args: topTool.defaultArgs ?? {} }
      : null

  const selectionReason =
    judgedSelectionReason ?? defaultSelectionReason(taskFrame, topTool, primaryCandidate)
  const uiPayload: AgentUiPayload = buildAgentUiPayload(
    taskFrame,
    topTool,
    candidates,
    selectionReason,
    state.market_context,
    primaryCandidate,
    recallSummary,
  )

  return {
    intent: 'discover',
    task_frame: taskFrame,
    candidate_tools: candidates,
    selected_tool: selectedTool,
    selection_reason: selectionReason,
    ui_payload: uiPayload,
  }
}

const responseNode = async (state: PocketState): Promise<Partial<PocketState>> => {
  const promptInput = buildDiscoveryResponsePrompt(state)
  const finalText = await invokeModel(promptInput, DORA_PROMPT, 0.35)
  return { final_text: finalText }
}

function createGraph() {
  return new StateGraph(PocketStateAnnotation)
    .addNode('classifier', classifierNode)
    .addNode('response', responseNode)
    .addEdge(START, 'classifier')
    .addEdge('classifier', 'response')
    .addEdge('response', END)
    .compile()
}

const pocketGraph = createGraph()

export type ClarificationGraphInput = {
  sessionTurn: 1 | 2 | 3
  anchorPrompt: string
  priorMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  skipClarify?: boolean
}

function resolveClarificationInput(
  message: string,
  clarificationInput?: ClarificationGraphInput,
): ClarificationGraphInput {
  return {
    sessionTurn: clarificationInput?.sessionTurn ?? 1,
    anchorPrompt: clarificationInput?.anchorPrompt ?? message,
    priorMessages: clarificationInput?.priorMessages ?? [],
    skipClarify: clarificationInput?.skipClarify ?? false,
  }
}

export type PocketGraphResult = {
  text: string
  selected_tool: PocketSelectedTool
  ui_payload: AgentUiPayload
}

export async function runPocketGraph(
  message: string,
  marketContext: MarketContext,
  explanationMode: ExplanationMode = 'standard',
  clarificationInput?: ClarificationGraphInput,
): Promise<PocketGraphResult> {
  const clarification = resolveClarificationInput(message, clarificationInput)
  const initialState = createInitialState(message, marketContext, explanationMode, {
    anchorPrompt: clarification.anchorPrompt,
    priorMessages: clarification.priorMessages,
  })
  const result = await pocketGraph.invoke(initialState)
  return {
    text: result.final_text,
    selected_tool: result.selected_tool,
    ui_payload: result.ui_payload,
  }
}

export type PocketStreamEvent =
  | { type: 'progress'; stage: ProgressStage }
  | {
      type: 'clarify'
      question: string
      missingInputs: string[]
      quickReplies: string[]
    }
  | { type: 'meta'; selected_tool: PocketSelectedTool; ui_payload: AgentUiPayload }
  | { type: 'delta'; text: string }
  | {
      type: 'done'
      text: string
      clarificationStatus: ClarificationDoneStatus
      selected_tool: PocketSelectedTool
      ui_payload: AgentUiPayload
    }

export async function* streamPocketGraph(
  message: string,
  marketContext: MarketContext,
  explanationMode: ExplanationMode = 'standard',
  clarificationInput?: ClarificationGraphInput,
): AsyncGenerator<PocketStreamEvent> {
  const clarification = resolveClarificationInput(message, clarificationInput)
  const initialState = createInitialState(message, marketContext, explanationMode, {
    anchorPrompt: clarification.anchorPrompt,
    priorMessages: clarification.priorMessages,
  })

  yield { type: 'progress', stage: 'understanding' }

  const classifiedState = {
    ...initialState,
    ...(await classifierNode(initialState)),
  } as PocketState

  yield { type: 'progress', stage: 'constraining' }
  yield { type: 'progress', stage: 'recalling' }
  yield { type: 'progress', stage: 'ranking' }

  const outcome = resolveClarifyOutcome({
    missingInputs: classifiedState.task_frame.missingInputs,
    sessionTurn: clarification.sessionTurn,
    skipClarify: clarification.skipClarify === true,
    explanationMode,
  })

  if (outcome === 'clarifying') {
    const question = buildClarifyQuestion(classifiedState.task_frame.missingInputs, explanationMode)
    const quickReplies = resolveQuickReplies(classifiedState.task_frame.missingInputs)
    yield { type: 'progress', stage: 'clarifying' }
    yield {
      type: 'clarify',
      question,
      missingInputs: classifiedState.task_frame.missingInputs,
      quickReplies,
    }
    yield {
      type: 'meta',
      selected_tool: classifiedState.selected_tool,
      ui_payload: classifiedState.ui_payload,
    }
    yield {
      type: 'done',
      text: question,
      clarificationStatus: 'clarifying',
      selected_tool: classifiedState.selected_tool,
      ui_payload: classifiedState.ui_payload,
    }
    return
  }

  const lowConfidence = outcome === 'exhausted' || clarification.skipClarify === true
  const uiPayload: AgentUiPayload = {
    ...classifiedState.ui_payload,
    confidenceLevel: lowConfidence ? 'low' : 'normal',
  }
  const stateWithUi = { ...classifiedState, ui_payload: uiPayload }

  yield {
    type: 'meta',
    selected_tool: stateWithUi.selected_tool,
    ui_payload: uiPayload,
  }

  const responseState = {
    ...stateWithUi,
    ...(await responseNode(stateWithUi)),
  } as PocketState

  yield { type: 'progress', stage: 'ready' }

  const text = responseState.final_text
  for (const chunk of chunkResponseText(text)) {
    yield { type: 'delta', text: chunk }
  }
  yield {
    type: 'done',
    text,
    clarificationStatus: outcome,
    selected_tool: responseState.selected_tool,
    ui_payload: uiPayload,
  }
}
