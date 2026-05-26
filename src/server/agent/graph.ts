import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { tool } from '@langchain/core/tools'
import type { AgentUiPayload, MarketContext } from '@/shared/market-types'
import type { ExplanationMode } from '@/shared/user-settings'
import {
  createInitialState,
  type PocketIntent,
  type PocketSelectedTool,
  type PocketState,
} from '@/server/agent/state'
import { executeTool, TOOL_DEFINITIONS } from '@/server/agent/tools'
import { ANSWER_BOOK_PROMPT, createModel, DORA_PROMPT, invokeModel } from '@/server/agent/model'
import {
  buildAgentUiPayload,
  buildRankedCandidates,
  defaultSelectionReason,
} from '@/server/agent/ui-payload'
import { chunkResponseText } from '@/server/agent/stream'
import { buildBuiltinResponsePrompt, buildDiscoveryResponsePrompt } from '@/server/agent/prompts'
import { buildTaskFrame, intentFromToolId, type Classified } from '@/server/agent/task-frame'
import { normalizeArgs, normalizeToolArgs } from '@/server/agent/tool-args'
import { getToolById, isBuiltinTool } from '@/shared/tool-registry'

type ModelToolCall = {
  name?: string
  args?: Record<string, unknown> | string
}

const MODEL_TOOLS = TOOL_DEFINITIONS.map((definition) =>
  tool(async (input) => JSON.stringify(input), {
    name: definition.name,
    description: definition.description,
    schema: definition.inputSchema,
  }),
)

const TOOL_NAME_TO_ID = new Map(
  TOOL_DEFINITIONS.map((definition) => [definition.name, definition.toolId] as const),
)

// classifyMessage 只负责把自然语言压成 intent + tool args，不处理 UI 推荐排序。
async function classifyMessage(
  userText: string,
  answerBookFromPocket: boolean,
): Promise<Classified> {
  if (answerBookFromPocket) {
    return { intent: 'answer_book', selectedTool: null }
  }

  try {
    const model = createModel(0).bindTools(MODEL_TOOLS)
    const response = await model.invoke([
      { role: 'system', content: DORA_PROMPT },
      { role: 'user', content: userText },
    ])
    const toolCalls = ((response as { tool_calls?: ModelToolCall[] }).tool_calls ?? []).filter(
      Boolean,
    )
    const firstCall = toolCalls[0]
    if (!firstCall?.name) {
      return { intent: 'discover', selectedTool: null }
    }
    const toolId = TOOL_NAME_TO_ID.get(firstCall.name)
    if (!toolId) {
      return { intent: 'discover', selectedTool: null }
    }
    const normalized = normalizeToolArgs(toolId, normalizeArgs(firstCall.args))
    return {
      intent: intentFromToolId(toolId),
      selectedTool: { toolId, args: normalized },
    }
  } catch {
    return { intent: 'discover', selectedTool: null }
  }
}

function isBuiltinIntent(intent: PocketIntent): boolean {
  return ['time', 'weather', 'exchange', 'air_quality', 'web_summary'].includes(intent)
}

function canUseBuiltinTool(
  toolId: string | null | undefined,
  builtinToolsEnabled: boolean,
): boolean {
  if (!toolId) return false
  if (builtinToolsEnabled) return true
  return !isBuiltinTool(getToolById(toolId))
}

const PocketStateAnnotation = Annotation.Root({
  messages: Annotation<PocketState['messages']>(),
  intent: Annotation<PocketState['intent']>(),
  task_frame: Annotation<PocketState['task_frame']>(),
  candidate_tools: Annotation<PocketState['candidate_tools']>(),
  selected_tool: Annotation<PocketState['selected_tool']>(),
  selection_reason: Annotation<PocketState['selection_reason']>(),
  tool_result: Annotation<PocketState['tool_result']>(),
  ui_payload: Annotation<PocketState['ui_payload']>(),
  final_text: Annotation<PocketState['final_text']>(),
  answerBookFromPocket: Annotation<PocketState['answerBookFromPocket']>(),
  market_context: Annotation<PocketState['market_context']>(),
  builtin_tools_enabled: Annotation<PocketState['builtin_tools_enabled']>(),
  explanation_mode: Annotation<PocketState['explanation_mode']>(),
})

// classifierNode 负责把任务框架、候选召回和 UI 解释层一次性补齐。
const classifierNode = async (state: PocketState): Promise<Partial<PocketState>> => {
  const userText = state.messages[state.messages.length - 1]?.content ?? ''
  const taskFrame = buildTaskFrame(
    userText,
    state.answerBookFromPocket,
    state.builtin_tools_enabled,
  )
  const classified = await classifyMessage(userText, state.answerBookFromPocket)
  const {
    candidates,
    topTool,
    primaryCandidate,
    selectionReason: judgedSelectionReason,
    recallSummary,
  } = await buildRankedCandidates(
    userText,
    state.market_context,
    state.builtin_tools_enabled,
    taskFrame,
  )
  const classifiedSelectedTool =
    classified.selectedTool &&
    canUseBuiltinTool(classified.selectedTool.toolId, state.builtin_tools_enabled)
      ? classified.selectedTool
      : null
  const selectedTool =
    classifiedSelectedTool ??
    (topTool && primaryCandidate?.candidateType !== 'external_suggestion'
      ? canUseBuiltinTool(topTool.id, state.builtin_tools_enabled)
        ? { toolId: topTool.id, args: topTool.defaultArgs ?? {} }
        : null
      : null)
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
    intent:
      classifiedSelectedTool != null
        ? classified.intent
        : taskFrame.mode === 'discover'
          ? 'discover'
          : classified.intent,
    task_frame: taskFrame,
    candidate_tools: candidates,
    selected_tool: selectedTool,
    selection_reason: selectionReason,
    ui_payload: uiPayload,
  }
}

// toolNode 只在原生能力 intent 下执行工具，市场推荐不会在服务端直接强制执行。
const toolNode = async (state: PocketState): Promise<Partial<PocketState>> => {
  if (!state.selected_tool) return { tool_result: '' }
  if (!isBuiltinIntent(state.intent)) return { tool_result: '' }
  if (!canUseBuiltinTool(state.selected_tool.toolId, state.builtin_tools_enabled)) {
    return { tool_result: '' }
  }
  const toolResult = await executeTool(state.selected_tool.toolId, state.selected_tool.args)
  return { tool_result: toolResult }
}

// responseNode 根据不同 intent 走三条路径：答案之书、原生能力结果整合、发现型推荐解释。
const responseNode = async (state: PocketState): Promise<Partial<PocketState>> => {
  if (state.intent === 'answer_book') {
    const finalText = await invokeModel(
      state.messages[state.messages.length - 1]?.content ?? '',
      ANSWER_BOOK_PROMPT,
      0.7,
    )
    return { final_text: finalText }
  }

  if (isBuiltinIntent(state.intent) && state.tool_result) {
    const prompt = buildBuiltinResponsePrompt(state)
    const finalText = await invokeModel(prompt, DORA_PROMPT, 0.2)
    return { final_text: finalText || state.tool_result }
  }

  const promptInput = buildDiscoveryResponsePrompt(state)
  const finalText = await invokeModel(promptInput, DORA_PROMPT, 0.35)
  return { final_text: finalText }
}

function createGraph() {
  return new StateGraph(PocketStateAnnotation)
    .addNode('classifier', classifierNode)
    .addNode('tool', toolNode)
    .addNode('response', responseNode)
    .addEdge(START, 'classifier')
    .addEdge('classifier', 'tool')
    .addEdge('tool', 'response')
    .addEdge('response', END)
    .compile()
}

const pocketGraph = createGraph()

export type PocketGraphResult = {
  text: string
  selected_tool: PocketSelectedTool
  ui_payload: AgentUiPayload
}

// 完整 graph 路径用于一次性求值场景。
export async function runPocketGraph(
  message: string,
  answerBookFromPocket: boolean,
  marketContext: MarketContext,
  builtinToolsEnabled: boolean,
  explanationMode: ExplanationMode = 'standard',
): Promise<PocketGraphResult> {
  const initialState = createInitialState(
    message,
    answerBookFromPocket,
    marketContext,
    builtinToolsEnabled,
    explanationMode,
  )
  const result = await pocketGraph.invoke(initialState)
  return {
    text: result.final_text,
    selected_tool: result.selected_tool,
    ui_payload: result.ui_payload,
  }
}

export type PocketStreamEvent =
  | { type: 'meta'; selected_tool: PocketSelectedTool; ui_payload: AgentUiPayload }
  | { type: 'delta'; text: string }
  | { type: 'done'; text: string; selected_tool: PocketSelectedTool; ui_payload: AgentUiPayload }

// 流式路径为了边算边吐 chunk，改为手动串联 node，而不是直接走 compile graph。
export async function* streamPocketGraph(
  message: string,
  answerBookFromPocket: boolean,
  marketContext: MarketContext,
  builtinToolsEnabled: boolean,
  explanationMode: ExplanationMode = 'standard',
): AsyncGenerator<PocketStreamEvent> {
  const initialState = createInitialState(
    message,
    answerBookFromPocket,
    marketContext,
    builtinToolsEnabled,
    explanationMode,
  )
  const classifiedState = {
    ...initialState,
    ...(await classifierNode(initialState)),
  } as PocketState

  yield {
    type: 'meta',
    selected_tool: classifiedState.selected_tool,
    ui_payload: classifiedState.ui_payload,
  }

  const toolState = {
    ...classifiedState,
    ...(await toolNode(classifiedState)),
  } as PocketState

  const responseState = {
    ...toolState,
    ...(await responseNode(toolState)),
  } as PocketState

  const text = responseState.final_text
  for (const chunk of chunkResponseText(text)) {
    yield { type: 'delta', text: chunk }
  }
  yield {
    type: 'done',
    text,
    selected_tool: responseState.selected_tool,
    ui_payload: responseState.ui_payload,
  }
}
