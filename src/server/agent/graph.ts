import type { AgentUiPayload, MarketContext } from '@/shared/market/market-types'
import type {
  ProgressStage,
  ClarificationDoneStatus,
} from '@/shared/discovery/clarification-session-types'
import type { ExplanationMode } from '@/shared/user/user-settings'
import {
  DEFAULT_RECOMMENDATION_MODE,
  normalizeRecommendationMode,
  type RecommendationMode,
} from '@/shared/discovery/recommendation-mode'
import {
  DEFAULT_RECOMMENDATION_PREFERENCES,
  normalizeRecommendationPreferences,
  type RecommendationPreferences,
} from '@/shared/discovery/recommendation-preferences'
import { buildClarifyQuestion, resolveClarifyOutcome } from '@/server/agent/clarify'
import { resolveQuickReplies } from '@/server/agent/quick-replies'
import { DORA_PROMPT, invokeModel } from '@/server/agent/model'
import {
  buildAgentUiPayload,
  buildRankedCandidates,
  defaultSelectionReason,
} from '@/server/agent/ui-payload'
import { chunkResponseText } from '@/server/agent/stream'
import { buildDiscoveryResponsePrompt } from '@/server/agent/prompts'
import { buildTaskFrame } from '@/server/agent/task-frame'

type SelectedTool = { toolId: string; args: Record<string, unknown> } | null

async function classifyTask(
  message: string,
  marketContext: MarketContext,
  recommendationMode: RecommendationMode,
  recommendationPreferences: RecommendationPreferences,
) {
  const taskFrame = buildTaskFrame(message)
  const {
    candidates,
    topTool,
    primaryCandidate,
    selectionReason: judgedSelectionReason,
    recallSummary,
  } = await buildRankedCandidates(
    message,
    marketContext,
    taskFrame,
    recommendationMode,
    recommendationPreferences,
  )

  const selectedTool: SelectedTool =
    topTool && primaryCandidate?.candidateType !== 'external_suggestion'
      ? { toolId: topTool.id, args: topTool.defaultArgs ?? {} }
      : null
  const selectionReason =
    (primaryCandidate ? judgedSelectionReason : undefined) ??
    defaultSelectionReason(
      taskFrame,
      topTool,
      primaryCandidate,
      recommendationMode,
      recommendationPreferences.minMatchScore,
    )
  const uiPayload = buildAgentUiPayload(
    taskFrame,
    topTool,
    candidates,
    selectionReason,
    marketContext,
    primaryCandidate,
    recallSummary,
    recommendationMode,
  )
  return { selectedTool, uiPayload }
}

export type ClarificationGraphInput = {
  sessionTurn: 1 | 2 | 3
  anchorPrompt: string
  priorMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  skipClarify?: boolean
}

function resolveTaskContext(message: string, input?: ClarificationGraphInput): string {
  if (!input || (input.sessionTurn === 1 && input.priorMessages.length === 0)) return message
  const latestMessage = input.skipClarify && message === '跳过' ? '' : message
  return [
    input.anchorPrompt,
    `澄清对话（用户补充是需求，助手提问只作上下文）：${JSON.stringify(input.priorMessages)}`,
    latestMessage ? `用户最新补充：${latestMessage}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export type PocketStreamEvent =
  | { type: 'progress'; stage: ProgressStage }
  | {
      type: 'clarify'
      question: string
      missingInputs: string[]
      quickReplies: string[]
    }
  | { type: 'meta'; selected_tool: SelectedTool; ui_payload: AgentUiPayload }
  | { type: 'delta'; text: string }
  | {
      type: 'done'
      text: string
      clarificationStatus: ClarificationDoneStatus
      selected_tool: SelectedTool
      ui_payload: AgentUiPayload
    }

export async function* streamPocketGraph(
  message: string,
  marketContext: MarketContext,
  explanationMode: ExplanationMode = 'standard',
  clarificationInput?: ClarificationGraphInput,
  recommendationMode: RecommendationMode = DEFAULT_RECOMMENDATION_MODE,
  recommendationPreferences: RecommendationPreferences = DEFAULT_RECOMMENDATION_PREFERENCES,
): AsyncGenerator<PocketStreamEvent> {
  const sessionTurn = clarificationInput?.sessionTurn ?? 1
  const skipClarify = clarificationInput?.skipClarify === true
  const normalizedRecommendationMode = normalizeRecommendationMode(recommendationMode)
  const normalizedRecommendationPreferences =
    normalizeRecommendationPreferences(recommendationPreferences)

  yield { type: 'progress', stage: 'understanding' }

  const { selectedTool, uiPayload: classifiedUi } = await classifyTask(
    resolveTaskContext(message, clarificationInput),
    marketContext,
    normalizedRecommendationMode,
    normalizedRecommendationPreferences,
  )
  const { missingInputs } = classifiedUi.taskFrame

  yield { type: 'progress', stage: 'constraining' }
  yield { type: 'progress', stage: 'recalling' }
  yield { type: 'progress', stage: 'ranking' }

  const outcome = resolveClarifyOutcome({
    missingInputs,
    sessionTurn,
    skipClarify,
    explanationMode,
  })

  if (outcome === 'clarifying') {
    const question = buildClarifyQuestion(missingInputs, explanationMode)
    const quickReplies = resolveQuickReplies(missingInputs)
    yield { type: 'progress', stage: 'clarifying' }
    yield { type: 'clarify', question, missingInputs, quickReplies }
    yield { type: 'meta', selected_tool: selectedTool, ui_payload: classifiedUi }
    yield {
      type: 'done',
      text: question,
      clarificationStatus: 'clarifying',
      selected_tool: selectedTool,
      ui_payload: classifiedUi,
    }
    return
  }

  const uiPayload: AgentUiPayload = {
    ...classifiedUi,
    confidenceLevel: outcome === 'exhausted' || skipClarify ? 'low' : 'normal',
  }
  yield { type: 'meta', selected_tool: selectedTool, ui_payload: uiPayload }

  let text: string
  if (uiPayload.candidates.length === 0) {
    text = uiPayload.selectionReason
  } else {
    const promptInput = buildDiscoveryResponsePrompt({
      message,
      uiPayload,
      explanationMode,
    })
    text = await invokeModel(promptInput, DORA_PROMPT, 0.35).catch(() => {
      const candidate = uiPayload.candidates[0]
      return `我先把候选收束到「${candidate.title}」。${uiPayload.selectionReason} 你可以先按这个方向试一次，再根据结果继续校准。`
    })
  }

  yield { type: 'progress', stage: 'ready' }
  for (const chunk of chunkResponseText(text)) {
    yield { type: 'delta', text: chunk }
  }
  yield {
    type: 'done',
    text,
    clarificationStatus: outcome,
    selected_tool: selectedTool,
    ui_payload: uiPayload,
  }
}
