import type { Step2Message, Step2Session } from '@/shared/step2-session-types'

export function createStep2Session(anchorPrompt: string): Step2Session {
  return {
    turn: 1,
    anchorPrompt,
    messages: [],
    status: 'thinking',
    dialogueExpanded: false,
    quickReplies: [],
  }
}

export function appendStep2Turn(
  session: Step2Session,
  turn: { user: string; assistant: string },
): Step2Session {
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
  session: Step2Session,
  expanded: boolean,
): Step2Message[] {
  if (expanded || session.messages.length <= 2) return session.messages
  return session.messages.slice(-2)
}

export function canContinueClarify(session: Step2Session, skipClarify: boolean): boolean {
  if (skipClarify) return false
  return session.turn < 3
}
