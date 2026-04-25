import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { tool } from '@langchain/core/tools'
import type {
  AgentTaskFrame,
  AgentUiPayload,
  MarketContext,
} from '@/shared/market-types'
import {
  createInitialState,
  type PocketIntent,
  type PocketSelectedTool,
  type PocketState,
} from '@/server/agent/state'
import { executeTool, TOOL_DEFINITIONS } from '@/server/agent/tools'
import {
  ANSWER_BOOK_PROMPT,
  createModel,
  DORA_PROMPT,
  invokeModel,
} from '@/server/agent/model'
import {
  buildAgentUiPayload,
  buildRankedCandidates,
  defaultSelectionReason,
  formatCandidateLines,
  matchingSubmissionLines,
} from '@/server/agent/ui-payload'
import { chunkResponseText } from '@/server/agent/stream'

type ModelToolCall = {
  name?: string
  args?: Record<string, unknown> | string
}

type Classified = {
  intent: PocketIntent
  selectedTool: PocketSelectedTool
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

function intentFromToolId(toolId: string): PocketIntent {
  if (toolId === 'weather') return 'weather'
  if (toolId === 'time') return 'time'
  if (toolId === 'exchange_rate') return 'exchange'
  if (toolId === 'air_quality') return 'air_quality'
  if (toolId === 'web_summary') return 'web_summary'
  return 'discover'
}

function normalizeArgs(value: ModelToolCall['args']): Record<string, unknown> {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }
  return value
}

function normalizeToolArgs(toolId: string, args: Record<string, unknown>): Record<string, unknown> {
  if (toolId === 'weather' || toolId === 'air_quality') {
    const location =
      typeof args.location === 'string' && args.location.trim() ? args.location.trim() : '上海'
    return { location }
  }
  if (toolId === 'exchange_rate') {
    const from =
      typeof args.from === 'string' && args.from.trim() ? args.from.trim().toUpperCase() : 'USD'
    const to =
      typeof args.to === 'string' && args.to.trim() ? args.to.trim().toUpperCase() : 'CNY'
    const amount =
      typeof args.amount === 'number' && Number.isFinite(args.amount) && args.amount > 0
        ? args.amount
        : 1
    return { from, to, amount }
  }
  if (toolId === 'web_summary') {
    const url = typeof args.url === 'string' ? args.url.trim() : ''
    return { url }
  }
  return {}
}

function buildTaskFrame(userText: string, answerBookFromPocket: boolean): AgentTaskFrame {
  if (answerBookFromPocket) {
    return {
      goal: userText,
      mode: 'answer_book',
      missingInputs: [],
    }
  }

  const text = userText.trim()
  const lower = text.toLowerCase()
  const missingInputs: string[] = []
  if (
    (lower.includes('网页') || lower.includes('链接') || lower.includes('摘要')) &&
    !/^https?:\/\//i.test(text) &&
    !lower.includes('www.')
  ) {
    missingInputs.push('网页链接')
  }
  if (
    (lower.includes('天气') || lower.includes('空气')) &&
    !/[北京上海广州深圳杭州西安成都重庆南京苏州天津武汉长沙]/.test(text)
  ) {
    missingInputs.push('城市')
  }

  if (lower.includes('收藏') || lower.includes('口袋')) {
    return { goal: text, mode: 'manage_pocket', missingInputs }
  }
  if (
    lower.includes('工具') ||
    lower.includes('推荐') ||
    lower.includes('找个') ||
    lower.includes('网站') ||
    lower.includes('资源') ||
    lower.includes('怎么找')
  ) {
    return { goal: text, mode: 'discover', missingInputs }
  }
  if (
    lower.includes('天气') ||
    lower.includes('时间') ||
    lower.includes('汇率') ||
    lower.includes('空气') ||
    lower.includes('摘要') ||
    lower.includes('链接')
  ) {
    return { goal: text, mode: 'use_builtin', missingInputs }
  }
  return { goal: text, mode: 'chat', missingInputs }
}

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
})

const classifierNode = async (state: PocketState): Promise<Partial<PocketState>> => {
  const userText = state.messages[state.messages.length - 1]?.content ?? ''
  const taskFrame = buildTaskFrame(userText, state.answerBookFromPocket)
  const classified = await classifyMessage(userText, state.answerBookFromPocket)
  const { candidates, topTool } = buildRankedCandidates(userText, state.market_context)
  const selectedTool =
    classified.selectedTool ?? (topTool ? { toolId: topTool.id, args: topTool.defaultArgs ?? {} } : null)
  const selectionReason = defaultSelectionReason(taskFrame, topTool)
  const uiPayload: AgentUiPayload = buildAgentUiPayload(
    taskFrame,
    topTool,
    candidates,
    selectionReason,
    state.market_context,
  )

  return {
    intent:
      classified.selectedTool != null
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

const toolNode = async (state: PocketState): Promise<Partial<PocketState>> => {
  if (!state.selected_tool) return { tool_result: '' }
  if (!isBuiltinIntent(state.intent)) return { tool_result: '' }
  const toolResult = await executeTool(state.selected_tool.toolId, state.selected_tool.args)
  return { tool_result: toolResult }
}

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
    const prompt = [
      `用户问题：${state.messages[state.messages.length - 1]?.content ?? ''}`,
      `工具结果：${state.tool_result}`,
      `选择理由：${state.selection_reason}`,
      '请用简洁方式回答，并补一句“下一步可做什么”。',
    ].join('\n')
    const finalText = await invokeModel(prompt, DORA_PROMPT, 0.2)
    return { final_text: finalText || state.tool_result }
  }

  const promptInput = [
    `用户问题：${state.messages[state.messages.length - 1]?.content ?? ''}`,
    `任务模式：${state.task_frame.mode}`,
    `缺失参数：${state.task_frame.missingInputs.join('、') || '无'}`,
    `推荐理由：${state.selection_reason}`,
    `用户偏好画像：${state.ui_payload.preferenceSignals.join('、') || '无'}`,
    `候选工具：\n${formatCandidateLines(state.candidate_tools)}`,
    `用户提交的市场条目：\n${matchingSubmissionLines(
      state.messages[state.messages.length - 1]?.content ?? '',
      state.market_context,
    )}`,
    '请输出：一句总判断 + 最值得试的工具 + 为什么 + 建议下一步。',
  ].join('\n')
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

export async function runPocketGraph(
  message: string,
  answerBookFromPocket: boolean,
  marketContext: MarketContext,
): Promise<PocketGraphResult> {
  const initialState = createInitialState(message, answerBookFromPocket, marketContext)
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

export async function* streamPocketGraph(
  message: string,
  answerBookFromPocket: boolean,
  marketContext: MarketContext,
): AsyncGenerator<PocketStreamEvent> {
  const initialState = createInitialState(message, answerBookFromPocket, marketContext)
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
