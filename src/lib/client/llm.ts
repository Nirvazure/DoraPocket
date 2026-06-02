import type { AgentUiPayload } from '@/shared/market-types'
import type { ProgressStage, Step2DoneStatus, Step2Message } from '@/shared/step2-session-types'
import type { ExplanationMode } from '@/shared/user-settings'

export type AskQwenOptions = {
  signal?: AbortSignal
  explanationMode?: ExplanationMode
  sessionTurn?: 1 | 2 | 3
  anchorPrompt?: string
  priorMessages?: Step2Message[]
  skipClarify?: boolean
  onProgress?: (stage: ProgressStage) => void
  onClarify?: (payload: {
    question: string
    missingInputs: string[]
    quickReplies: string[]
  }) => void
  onMeta?: (payload: { selectedTool: ChatToolPayload; uiPayload: AgentUiPayload | null }) => void
  onDelta?: (text: string) => void
}

export type ChatToolPayload = {
  toolId: string
  args: Record<string, unknown>
} | null

export type ChatReply = {
  text: string
  selectedTool: ChatToolPayload
  uiPayload: AgentUiPayload | null
  step2Status: Step2DoneStatus
}

type StreamProgressEvent = {
  type: 'progress'
  stage?: ProgressStage
}

type StreamClarifyEvent = {
  type: 'clarify'
  question?: string
  missingInputs?: string[]
  quickReplies?: string[]
}

type StreamMetaEvent = {
  type: 'meta'
  selected_tool?: ChatToolPayload
  ui_payload?: AgentUiPayload
}

type StreamDeltaEvent = {
  type: 'delta'
  text?: string
}

type StreamDoneEvent = {
  type: 'done'
  text?: string
  step2Status?: Step2DoneStatus
  selected_tool?: ChatToolPayload
  ui_payload?: AgentUiPayload
}

type StreamErrorEvent = {
  type: 'error'
  error?: string
}

type StreamEvent =
  | StreamProgressEvent
  | StreamClarifyEvent
  | StreamMetaEvent
  | StreamDeltaEvent
  | StreamDoneEvent
  | StreamErrorEvent

function parseStreamLine(line: string): StreamEvent | null {
  if (!line.trim()) return null
  try {
    return JSON.parse(line) as StreamEvent
  } catch {
    return null
  }
}

export async function askQwen(message: string, opts?: AskQwenOptions): Promise<ChatReply> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: opts?.signal,
    body: JSON.stringify({
      message,
      explanationMode: opts?.explanationMode ?? 'standard',
      sessionTurn: opts?.sessionTurn ?? 1,
      anchorPrompt: opts?.anchorPrompt,
      priorMessages: opts?.priorMessages ?? [],
      skipClarify: opts?.skipClarify === true,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`chat api failed: ${response.status} ${detail}`)
  }
  if (!response.body) {
    throw new Error('chat api stream body is empty')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let selectedTool: ChatToolPayload = null
  let uiPayload: AgentUiPayload | null = null
  let fullText = ''
  let step2Status: Step2DoneStatus = 'ready'
  let buffer = ''

  while (true) {
    if (opts?.signal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError')
    }
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (opts?.signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError')
      }
      const event = parseStreamLine(line)
      if (!event) continue
      if (event.type === 'progress') {
        if (event.stage) opts?.onProgress?.(event.stage)
        continue
      }
      if (event.type === 'clarify') {
        opts?.onClarify?.({
          question: event.question ?? '',
          missingInputs: event.missingInputs ?? [],
          quickReplies: event.quickReplies ?? [],
        })
        continue
      }
      if (event.type === 'meta') {
        selectedTool = event.selected_tool ?? null
        uiPayload = event.ui_payload ?? null
        opts?.onMeta?.({ selectedTool, uiPayload })
        continue
      }
      if (event.type === 'delta') {
        const text = event.text ?? ''
        fullText += text
        if (text) opts?.onDelta?.(text)
        continue
      }
      if (event.type === 'done') {
        if (typeof event.text === 'string' && event.text.length > 0) {
          fullText = event.text
        }
        step2Status = event.step2Status ?? 'ready'
        if (event.selected_tool !== undefined) {
          selectedTool = event.selected_tool
        }
        if (event.ui_payload !== undefined) {
          uiPayload = event.ui_payload ?? null
        }
        continue
      }
      if (event.type === 'error') {
        throw new Error(event.error || 'chat stream failed')
      }
    }
  }

  return {
    text: fullText,
    selectedTool,
    uiPayload,
    step2Status,
  }
}
