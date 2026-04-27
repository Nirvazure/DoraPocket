import type { AgentUiPayload } from '@/shared/market-types'
import type { ExplanationMode } from '@/services/user-settings'

export type AskQwenOptions = {
  answerBookFromPocket?: boolean
  explanationMode?: ExplanationMode
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
  selected_tool?: ChatToolPayload
  ui_payload?: AgentUiPayload
}

type StreamErrorEvent = {
  type: 'error'
  error?: string
}

type StreamEvent = StreamMetaEvent | StreamDeltaEvent | StreamDoneEvent | StreamErrorEvent

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
    body: JSON.stringify({
      message,
      answerBookFromPocket: opts?.answerBookFromPocket === true,
      explanationMode: opts?.explanationMode ?? 'standard',
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
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const event = parseStreamLine(line)
      if (!event) continue
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
  }
}
