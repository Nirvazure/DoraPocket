export type ClarificationMessage = { role: 'user' | 'assistant'; content: string }

export type ClarificationStatus = 'thinking' | 'clarifying' | 'ready' | 'exhausted'

export type ClarificationSession = {
  turn: 1 | 2 | 3
  anchorPrompt: string
  messages: ClarificationMessage[]
  status: ClarificationStatus
  dialogueExpanded: boolean
  quickReplies: string[]
}

export type ProgressStage =
  | 'understanding'
  | 'constraining'
  | 'recalling'
  | 'ranking'
  | 'clarifying'
  | 'ready'

export type ClarificationDoneStatus = 'ready' | 'clarifying' | 'exhausted'
