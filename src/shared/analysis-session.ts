import type { ChatToolPayload } from '@/lib/client/llm'
import type { AgentUiPayload } from '@/shared/market-types'
import { createStep2Session } from '@/shared/step2-session'
import type { Step2Session } from '@/shared/step2-session-types'
import type { VoicePlaybackMode } from '@/shared/user-settings'

const KEY_RESULT_MAX_CHARS = 120

export type RunTurnOptions = {
  skipClarify?: boolean
  isContinuation?: boolean
  displayPrompt?: string
}

export type AgentTurnReply = {
  text: string
  selectedTool: ChatToolPayload
  uiPayload: AgentUiPayload | null
  recommendationSessionId?: string | null
}

export type AgentTurnRequestInput = {
  text: string
  options?: RunTurnOptions
  priorStep2: Step2Session | null
}

export type AgentTurnRequest = {
  safeText: string
  isContinuation: boolean
  session: Step2Session
  requestMessage: string
}

export function resolveAgentTurnRequest({
  text,
  options,
  priorStep2,
}: AgentTurnRequestInput): AgentTurnRequest | null {
  const safeText = text.trim()
  if (!safeText && !options?.skipClarify) return null

  const isContinuation = priorStep2?.status === 'clarifying' || options?.isContinuation === true
  const session =
    isContinuation && priorStep2
      ? priorStep2
      : createStep2Session(safeText || priorStep2?.anchorPrompt || '')

  return {
    safeText,
    isContinuation,
    session,
    requestMessage: isContinuation ? safeText || '跳过' : session.anchorPrompt,
  }
}

function truncatePlaybackText(text: string): string {
  return text.length <= KEY_RESULT_MAX_CHARS ? text : `${text.slice(0, KEY_RESULT_MAX_CHARS)}...`
}

export function resolveVoicePlaybackText(reply: AgentTurnReply, mode: VoicePlaybackMode): string {
  if (mode === 'full') {
    return reply.text.trim()
  }

  const selectionReason = reply.uiPayload?.selectionReason?.trim()
  if (selectionReason) {
    return truncatePlaybackText(selectionReason)
  }

  const text = reply.text.trim()
  if (!text) return ''

  const sentencePattern = /^[^\u3002\uff01\uff1f.!?\n]+[\u3002\uff01\uff1f.!?]?/u
  const firstSentence = text.match(sentencePattern)?.[0]?.trim() ?? text
  return truncatePlaybackText(firstSentence)
}
