import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { tool } from '@langchain/core/tools'
import { rankTools, type ToolItem, type ToolMatch } from '@/shared/tool-registry'
import type { AgentCandidate, AgentTaskFrame, AgentUiPayload, MarketContext } from '@/shared/market-types'
import { createInitialState, type PocketIntent, type PocketSelectedTool, type PocketState } from '@/server/agent/state'
import { executeTool, TOOL_DEFINITIONS } from '@/server/agent/tools'

const DORA_PROMPT = [
  '你是 DoraPocket，一个哆啦A梦风格但极其务实的工具发现 Agent。',
  '你优先帮用户找到最合适的工具，而不是空泛聊天。',
  '如果有原生内化能力，优先直接执行。',
  '如果更适合外部工具或资源，要明确给出推荐理由、适用场景和下一步动作。',
  '回答要简洁、清楚、偏产品经理+Agent 工程师口吻。',
].join(' ')

const ANSWER_BOOK_PROMPT = '你处于答案之书模式，只回答一句简短启发句。'

type ModelToolCall = {
  name?: string
  args?: Record<string, unknown> | string
}

type Classified = {
  intent: PocketIntent
  selectedTool: PocketSelectedTool
}

function createModel(temperature = 0.4) {
  const apiKey = process.env.QWEN_API_KEY?.trim()
  if (!apiKey) throw new Error('QWEN_API_KEY missing')
  return new ChatOpenAI({
    apiKey,
    model: process.env.QWEN_MODEL?.trim() || 'qwen-plus',
    temperature,
    configuration: {
      baseURL: process.env.QWEN_BASE_URL?.trim() || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    },
  })
}

function chunkToText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'text' in item) {
          const text = (item as { text?: unknown }).text
          return typeof text === 'string' ? text : ''
        }
        return ''
      })
      .join('')
  }
  return ''
}

async function invokeModel(input: string, systemPrompt: string, temperature = 0.4): Promise<string> {
  const model = createModel(temperature)
  const response = await model.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: input },
  ])
  return chunkToText(response.content).trim()
}

const MODEL_TOOLS = TOOL_DEFINITIONS.map((definition) =>
  tool(async (input) => JSON.stringify(input), {
    name: definition.name,
    description: definition.description,
    schema: definition.inputSchema,
  }),
)

const TOOL_NAME_TO_ID = new Map(TOOL_DEFINITIONS.map((definition) => [definition.name, definition.toolId] as const))

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
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {}
    } catch {
      return {}
    }
  }
  return value
}

function normalizeToolArgs(toolId: string, args: Record<string, unknown>): Record<string, unknown> {
  if (toolId === 'weather' || toolId === 'air_quality') {
    const location = typeof args.location === 'string' && args.location.trim() ? args.location.trim() : '上海'
    return { location }
  }
  if (toolId === 'exchange_rate') {
    const from = typeof args.from === 'string' && args.from.trim() ? args.from.trim().toUpperCase() : 'USD'
    const to = typeof args.to === 'string' && args.to.trim() ? args.to.trim().toUpperCase() : 'CNY'
    const amount = typeof args.amount === 'number' && Number.isFinite(args.amount) && args.amount > 0 ? args.amount : 1
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
  if ((lower.includes('网页') || lower.includes('链接') || lower.includes('摘要')) && !/^https?:\/\//i.test(text) && !lower.includes('www.')) {
    missingInputs.push('网页链接')
  }
  if ((lower.includes('天气') || lower.includes('空气')) && !/[北京上海广州深圳杭州西安成都重庆南京苏州天津武汉长沙]/.test(text)) {
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

function marketSignalsFromContext(marketContext: MarketContext) {
  return {
    savedToolIds: marketContext.savedItems.map((item) => item.toolId),
    subscribedToolIds: marketContext.subscriptions.filter((item) => item.active).map((item) => item.toolId),
    upvotedToolIds: marketContext.feedback.filter((item) => item.vote === 'up').map((item) => item.toolId),
    downvotedToolIds: marketContext.feedback.filter((item) => item.vote === 'down').map((item) => item.toolId),
    preferredCategories: marketContext.preferenceProfile.preferredCategories,
    preferredTags: marketContext.preferenceProfile.preferredTags,
    preferredPlatforms: marketContext.preferenceProfile.preferredPlatforms,
    preferredPricing: marketContext.preferenceProfile.preferredPricing,
    preferredExecutionModes: marketContext.preferenceProfile.preferredExecutionModes,
    avoidAuthWall: marketContext.preferenceProfile.avoidAuthWall,
    prefersSubscriptionTools: marketContext.preferenceProfile.prefersSubscriptionTools,
  }
}

function toCandidates(matches: ToolMatch[]): AgentCandidate[] {
  return matches.slice(0, 5).map((match) => ({
    toolId: match.tool.id,
    title: match.tool.name,
    url: match.tool.url,
    candidateType: 'tool',
    score: match.score,
    sourceLabel: match.sourceLabel,
    reason: match.reason,
  }))
}

function rankSubmissionCandidates(userText: string, marketContext: MarketContext): AgentCandidate[] {
  const lower = userText.trim().toLowerCase()
  if (!lower) return []
  return marketContext.submissions
    .map((item) => {
      const haystack = `${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase()
      let score = 0
      if (haystack.includes(lower)) score += 55
      for (const tag of item.tags) {
        if (lower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(lower)) score += 20
      }
      return {
        toolId: item.id,
        title: item.name,
        url: item.url,
        candidateType: 'submission' as const,
        score,
        sourceLabel: 'market' as const,
        reason: '这是你自己提交到市场的工具，和当前任务语义存在匹配。',
      }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

function defaultSelectionReason(taskFrame: AgentTaskFrame, topTool: ToolItem | null): string {
  if (!topTool) return '当前没有高置信度工具命中，先走解释型回答。'
  if (topTool.executionMode === 'native_card') return `${topTool.name} 是可直接执行的原生能力，适合当前问题。`
  if (taskFrame.mode === 'discover') return `${topTool.name} 更像外部强项工具，适合被推荐、收藏或订阅，而不是硬塞成内置能力。`
  return `${topTool.name} 与当前任务最匹配。`
}

async function classifyMessage(userText: string, answerBookFromPocket: boolean): Promise<Classified> {
  if (answerBookFromPocket) {
    return { intent: 'answer_book', selectedTool: null }
  }

  try {
    const model = createModel(0).bindTools(MODEL_TOOLS)
    const response = await model.invoke([
      { role: 'system', content: DORA_PROMPT },
      { role: 'user', content: userText },
    ])
    const toolCalls = ((response as { tool_calls?: ModelToolCall[] }).tool_calls ?? []).filter(Boolean)
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

function buildRecommendedActions(taskFrame: AgentTaskFrame, topTool: ToolItem | null): string[] {
  if (!topTool) return ['继续澄清目标', '缩小任务范围', '改用任意门模式再搜一轮']
  const actions = topTool.executionMode === 'native_card' ? ['直接调用', '收入口袋', '记录调用方式'] : ['打开工具', '收入口袋', '订阅这个工具']
  if (taskFrame.missingInputs.length > 0) {
    actions.unshift(`补充${taskFrame.missingInputs.join('、')}`)
  }
  return actions
}

function buildSelectionSignals(topTool: ToolItem | null, marketContext: MarketContext): string[] {
  if (!topTool) return []
  const signals: string[] = []
  if (marketContext.savedItems.some((item) => item.toolId === topTool.id)) signals.push('你已收藏过它')
  if (marketContext.subscriptions.some((item) => item.active && item.toolId === topTool.id)) signals.push('你已订阅它')
  if (marketContext.feedback.some((item) => item.toolId === topTool.id && item.vote === 'up')) signals.push('你给过正反馈')
  if (marketContext.feedback.some((item) => item.toolId === topTool.id && item.vote === 'down')) signals.push('你给过负反馈')
  if (topTool.trustSignals.official) signals.push('官方来源')
  if (topTool.trustSignals.communityVerified) signals.push('社区验证')
  if (topTool.sourceNote) signals.push(topTool.sourceNote)
  return signals.slice(0, 5)
}

function buildPreferenceSignals(topTool: ToolItem | null, marketContext: MarketContext): string[] {
  if (!topTool) return marketContext.preferenceProfile.summary.slice(0, 3)
  const signals = [...marketContext.preferenceProfile.summary]
  if (marketContext.preferenceProfile.preferredCategories.includes(topTool.category)) {
    signals.push(`命中你的长期偏好类目：${topTool.category}`)
  }
  const matchedTags = topTool.tags.filter((tag) => marketContext.preferenceProfile.preferredTags.includes(tag)).slice(0, 2)
  if (matchedTags.length > 0) {
    signals.push(`命中你的高频标签：${matchedTags.join(' / ')}`)
  }
  if (marketContext.preferenceProfile.avoidAuthWall && !topTool.requiresAuth) {
    signals.push('符合你偏好低摩擦、免登录工具的习惯')
  }
  if (marketContext.preferenceProfile.prefersSubscriptionTools && topTool.subscriptionSupport) {
    signals.push('符合你把工具沉淀成长期资产的习惯')
  }
  return Array.from(new Set(signals)).slice(0, 5)
}

function stageLabelFor(taskFrame: AgentTaskFrame, topTool: ToolItem | null): string {
  if (taskFrame.mode === 'answer_book') return '答案之书'
  if (taskFrame.mode === 'manage_pocket') return '整理口袋'
  if (topTool?.executionMode === 'native_card') return '原生执行'
  if (taskFrame.mode === 'discover') return '发现与排序'
  return '任务分析'
}

function stageTrailFor(taskFrame: AgentTaskFrame, topTool: ToolItem | null): string[] {
  const trail = ['识别任务']
  if (taskFrame.mode === 'discover') {
    trail.push('召回候选', '排序解释')
    if (topTool) trail.push(topTool.executionMode === 'native_card' ? '原生执行' : '市场推荐')
  } else if (taskFrame.mode === 'use_builtin') {
    trail.push('命中原生能力', '执行工具')
  } else if (taskFrame.mode === 'manage_pocket') {
    trail.push('整理资产')
  } else if (taskFrame.mode === 'answer_book') {
    trail.push('短答模式')
  } else {
    trail.push('生成建议')
  }
  return trail
}

function matchingSubmissionLines(userText: string, marketContext: MarketContext): string {
  const lower = userText.trim().toLowerCase()
  if (!lower) return '无'
  const matches = marketContext.submissions
    .filter((item) => {
      const haystack = `${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase()
      return haystack.includes(lower) || item.tags.some((tag) => lower.includes(tag.toLowerCase()))
    })
    .slice(0, 3)
  if (matches.length === 0) return '无'
  return matches.map((item) => `${item.name}｜${item.description}`).join('\n')
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
  const matches = rankTools(userText, marketSignalsFromContext(state.market_context))
  const candidates = [...toCandidates(matches), ...rankSubmissionCandidates(userText, state.market_context)]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  const topTool = matches[0]?.tool ?? null
  const selectedTool =
    classified.selectedTool ??
    (topTool ? { toolId: topTool.id, args: topTool.defaultArgs ?? {} } : null)
  const selectionReason = defaultSelectionReason(taskFrame, topTool)
  const uiPayload: AgentUiPayload = {
    stageLabel: stageLabelFor(taskFrame, topTool),
    stageTrail: stageTrailFor(taskFrame, topTool),
    taskFrame,
    candidates,
    selectionReason,
    selectionSignals: buildSelectionSignals(topTool, state.market_context),
    preferenceSignals: buildPreferenceSignals(topTool, state.market_context),
    recommendedActions: buildRecommendedActions(taskFrame, topTool),
    shouldAutoSave: Boolean(topTool && (topTool.executionMode === 'native_card' || taskFrame.mode === 'discover')),
  }
  return {
    intent: classified.selectedTool ? classified.intent : taskFrame.mode === 'discover' ? 'discover' : classified.intent,
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

function formatCandidateLines(state: PocketState): string {
  if (state.candidate_tools.length === 0) return '无候选工具。'
  return state.candidate_tools
    .map((candidate, index) => `${index + 1}. ${candidate.title}｜来源=${candidate.sourceLabel}｜理由=${candidate.reason}`)
    .join('\n')
}

const responseNode = async (state: PocketState): Promise<Partial<PocketState>> => {
  if (state.intent === 'answer_book') {
    const finalText = await invokeModel(state.messages[state.messages.length - 1]?.content ?? '', ANSWER_BOOK_PROMPT, 0.7)
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
    `候选工具：\n${formatCandidateLines(state)}`,
    `用户提交的市场条目：\n${matchingSubmissionLines(state.messages[state.messages.length - 1]?.content ?? '', state.market_context)}`,
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
  return { text: result.final_text, selected_tool: result.selected_tool, ui_payload: result.ui_payload }
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
  const chunks = text.match(/.{1,24}/g) ?? []
  for (const chunk of chunks) {
    yield { type: 'delta', text: chunk }
  }
  yield {
    type: 'done',
    text,
    selected_tool: responseState.selected_tool,
    ui_payload: responseState.ui_payload,
  }
}
