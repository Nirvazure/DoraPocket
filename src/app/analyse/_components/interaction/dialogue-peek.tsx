import { STEP2_COPY } from '@/shared/ui-copy'
import type { Step2Message } from '@/shared/step2-session-types'

export type DialoguePeekProps = {
  messages: Step2Message[]
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
          {STEP2_COPY.expandEarlier}
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
