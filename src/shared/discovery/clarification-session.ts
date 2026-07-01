import type {
  ClarificationMessage,
  ClarificationSession,
} from '@/shared/discovery/clarification-session-types'

export function createClarificationSession(anchorPrompt: string): ClarificationSession {
  return {
    turn: 1,
    anchorPrompt,
    messages: [],
    status: 'thinking',
    dialogueExpanded: false,
    quickReplies: [],
  }
}

export function appendClarificationTurn(
  session: ClarificationSession,
  turn: { user: string; assistant: string },
): ClarificationSession {
  const nextTurn = Math.min(3, session.turn + 1) as 1 | 2 | 3
  return {
    ...session,
    turn: session.status === 'clarifying' ? nextTurn : session.turn,
    messages: [
      ...session.messages,
      { role: 'user' as const, content: turn.user },
      { role: 'assistant' as const, content: turn.assistant },
    ].slice(-6),
  }
}

export function getVisibleDialogueMessages(
  session: ClarificationSession,
  expanded: boolean,
): ClarificationMessage[] {
  if (expanded || session.messages.length <= 2) return session.messages
  return session.messages.slice(-2)
}

export function canContinueClarify(session: ClarificationSession, skipClarify: boolean): boolean {
  if (skipClarify) return false
  return session.turn < 3
}
