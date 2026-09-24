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
) {
  const taskFrame = buildTaskFrame(message)
  const {
    candidates,
    topTool,
    primaryCandidate,
    selectionReason: judgedSelectionReason,
    recallSummary,
  } = await buildRankedCandidates(message, marketContext, taskFrame, recommendationMode)

  const selectedTool: SelectedTool =
    topTool && primaryCandidate?.candidateType !== 'external_suggestion'
      ? { toolId: topTool.id, args: topTool.defaultArgs ?? {} }
      : null
  const selectionReason =
    judgedSelectionReason ??
    defaultSelectionReason(taskFrame, topTool, primaryCandidate, recommendationMode)
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
): AsyncGenerator<PocketStreamEvent> {
  const sessionTurn = clarificationInput?.sessionTurn ?? 1
  const skipClarify = clarificationInput?.skipClarify === true
  const normalizedRecommendationMode = normalizeRecommendationMode(recommendationMode)

  yield { type: 'progress', stage: 'understanding' }

  const { selectedTool, uiPayload: classifiedUi } = await classifyTask(
    message,
    marketContext,
    normalizedRecommendationMode,
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

  const promptInput = buildDiscoveryResponsePrompt({
    message,
    uiPayload,
    marketContext,
    explanationMode,
  })
  const text = await invokeModel(promptInput, DORA_PROMPT, 0.35).catch(() => {
    const candidate = uiPayload.candidates[0]
    if (candidate) {
      return `我先把候选收束到「${candidate.title}」。${uiPayload.selectionReason} 你可以先按这个方向试一次，再根据结果继续校准。`
    }
    return '这次已经完成任务理解，但当前本地环境缺少可用的模型或工具库配置，暂时无法生成稳定推荐。你可以补充工具库或模型配置后再试。'
  })

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
