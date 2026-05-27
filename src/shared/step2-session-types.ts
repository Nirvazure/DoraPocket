export type Step2Message = { role: 'user' | 'assistant'; content: string }

export type Step2Status = 'thinking' | 'clarifying' | 'ready' | 'exhausted'

export type Step2Session = {
  turn: 1 | 2 | 3
  anchorPrompt: string
  messages: Step2Message[]
  status: Step2Status
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

export type Step2DoneStatus = 'ready' | 'clarifying' | 'exhausted'
