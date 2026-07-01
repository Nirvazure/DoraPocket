import { CLARIFICATION_COPY } from '@/shared/copy/ui-copy'
import type { ClarificationMessage } from '@/shared/discovery/clarification-session-types'

export type DialoguePeekProps = {
  messages: ClarificationMessage[]
  expanded: boolean
  canExpandEarlier: boolean
  onToggleExpand: () => void
}

export function DialoguePeek({
  messages,
  expanded,
  canExpandEarlier,
  onToggleExpand,
}: DialoguePeekProps) {
  const visible = expanded ? messages : messages.slice(-2)
  if (visible.length === 0) return null

  return (
    <div className="max-h-28 overflow-y-auto px-3 pt-2">
      {canExpandEarlier && !expanded ? (
        <button
          type="button"
          onClick={onToggleExpand}
          className="mb-1 text-[11px] font-semibold text-primary"
        >
          {CLARIFICATION_COPY.expandEarlier}
        </button>
      ) : null}
      {visible.map((msg, index) => (
        <p key={`${msg.role}-${index}`} className="text-xs leading-6 text-foreground/80">
          <span className="font-bold">{msg.role === 'user' ? '你' : 'Dora'}：</span>
          {msg.content}
        </p>
      ))}
    </div>
  )
}
