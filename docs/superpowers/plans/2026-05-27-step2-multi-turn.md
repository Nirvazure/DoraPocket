# Step 2 多轮分析工作流 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在分析页实现 Step 2 内最多 3 轮短对话澄清，左侧展示真实思考轨，右侧底部栏承载全部对话与输入，Canvas 不被压缩。

**Architecture:** 新增 `Step2Session` 共享类型贯穿 client ↔ API ↔ LangGraph；Agent 在 classifier 后按 `missingInputs × sessionTurn × skipClarify` 决定 clarify 短路或继续 response；前端 `DoraBottomInteractionZone` 替换现有 `AnalysisBottomBar` 分支逻辑，DialoguePeek 默认只显示最后一轮。

**Tech Stack:** Next.js App Router, LangGraph agent (`src/server/agent/graph.ts`), NDJSON streaming (`/api/chat`), React hooks + Zustand store, `node:test` + `tsx` for unit tests.

**Spec:** `docs/superpowers/specs/2026-05-27-step2-multi-turn-design.md`

---

## File Map

| File                                                 | Responsibility                                                                                                 |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/shared/step2-session-types.ts`                  | **Create** — `Step2Message`, `Step2Session`, `Step2Status`, stream stage types                                 |
| `src/shared/step2-session.ts`                        | **Create** — pure helpers: `createStep2Session`, `appendTurn`, `visibleDialogueMessages`, `canContinueClarify` |
| `src/server/agent/clarify.ts`                        | **Create** — `resolveClarifyOutcome`, `buildClarifyQuestion`, testable routing                                 |
| `src/server/agent/quick-replies.ts`                  | **Create** — `resolveQuickReplies(missingInputs, agentReplies?)`                                               |
| `src/server/agent/graph.ts`                          | **Modify** — progress/clarify yields, session params, clarify short-circuit                                    |
| `src/server/agent/state.ts`                          | **Modify** — initial state from anchor + prior messages                                                        |
| `src/app/api/chat/route.ts`                          | **Modify** — parse/pass session fields                                                                         |
| `src/lib/client/llm.ts`                              | **Modify** — request body + parse progress/clarify/done.step2Status                                            |
| `src/components/discovery/analysis-stage-content.ts` | **Modify** — extend `AnalysisFlow`, input-lock helpers for clarifying                                          |
| `src/hooks/analysis-stage-restart.ts`                | **Modify** — don't restart on Step 2 continuation                                                              |
| `src/hooks/use-analysis-session.ts`                  | **Modify** — session state, new vs continue turn, skip handler                                                 |
| `src/hooks/use-analysis-page-controller.ts`          | **Modify** — wire session, skip, dialogueExpanded                                                              |
| `src/hooks/use-voice-input.ts`                       | **Modify** — continuation path preserves anchor                                                                |
| `src/components/dialogue-peek.tsx`                   | **Create** — bottom dialogue summary (strategy A)                                                              |
| `src/components/step2-action-row.tsx`                | **Create** — chips + skip button                                                                               |
| `src/components/dora-bottom-interaction-zone.tsx`    | **Create** — orchestrates peek + action + input surface                                                        |
| `src/components/analysis-bottom-bar.tsx`             | **Modify** — thin wrapper or re-export zone                                                                    |
| `src/components/analysis-stage-panel.tsx`            | **Modify** — canvas min-h, pass zone props                                                                     |
| `src/App.tsx`                                        | **Modify** — wire new props                                                                                    |
| `src/shared/market-types.ts`                         | **Modify** — add `confidenceLevel?: 'normal' \| 'low'` to `AgentUiPayload`                                     |
| `src/shared/ui-copy.ts`                              | **Modify** — skip label, low-confidence hint, clarify placeholders                                             |

**Out of scope (Phase 4 follow-up):** response 真 token 流、HITL 确认弹窗。

**Test command (all tasks):**

```bash
node --import tsx --test path/to/file.test.ts
```

---

## Phase 1 — Types, Agent Routing, API

### Task 1: Step2 session types and pure helpers

**Files:**

- Create: `src/shared/step2-session-types.ts`
- Create: `src/shared/step2-session.ts`
- Create: `src/shared/step2-session.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/shared/step2-session.test.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createStep2Session,
  appendStep2Turn,
  getVisibleDialogueMessages,
  canContinueClarify,
} from '@/shared/step2-session'

test('createStep2Session starts at turn 1 with anchor only in messages after first user turn', () => {
  const session = createStep2Session('查天气')
  assert.equal(session.turn, 1)
  assert.equal(session.anchorPrompt, '查天气')
  assert.equal(session.messages.length, 0)
  assert.equal(session.status, 'thinking')
})

test('getVisibleDialogueMessages returns last round by default', () => {
  const session = createStep2Session('查天气')
  const withTurns = appendStep2Turn(
    appendStep2Turn(session, { user: '查天气', assistant: '哪个城市？' }),
    { user: '北京', assistant: '好的，我来判断。' },
  )
  const visible = getVisibleDialogueMessages(withTurns, false)
  assert.equal(visible.length, 2)
  assert.equal(visible[0].content, '北京')
  assert.equal(visible[1].content, '好的，我来判断。')
})

test('canContinueClarify is false at turn 3', () => {
  const session = { ...createStep2Session('x'), turn: 3 as const, status: 'clarifying' as const }
  assert.equal(canContinueClarify(session, false), false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/shared/step2-session.test.ts`  
Expected: FAIL — module not found

- [ ] **Step 3: Implement types and helpers**

```typescript
// src/shared/step2-session-types.ts
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
```

```typescript
// src/shared/step2-session.ts
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
      { role: 'user', content: turn.user },
      { role: 'assistant', content: turn.assistant },
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/shared/step2-session.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/step2-session-types.ts src/shared/step2-session.ts src/shared/step2-session.test.ts
git commit -m "feat: add Step2 session types and pure helpers"
```

---

### Task 2: Clarify routing logic (server, testable)

**Files:**

- Create: `src/server/agent/clarify.ts`
- Create: `src/server/agent/quick-replies.ts`
- Create: `src/server/agent/clarify.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/server/agent/clarify.test.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveClarifyOutcome } from '@/server/agent/clarify'
import { resolveQuickReplies } from '@/server/agent/quick-replies'

test('resolveClarifyOutcome returns clarifying when missing inputs and turn < 3', () => {
  assert.equal(
    resolveClarifyOutcome({ missingInputs: ['城市'], sessionTurn: 1, skipClarify: false }),
    'clarifying',
  )
})

test('resolveClarifyOutcome returns exhausted at turn 3 with missing inputs', () => {
  assert.equal(
    resolveClarifyOutcome({ missingInputs: ['城市'], sessionTurn: 3, skipClarify: false }),
    'exhausted',
  )
})

test('resolveClarifyOutcome returns ready when no missing inputs', () => {
  assert.equal(
    resolveClarifyOutcome({ missingInputs: [], sessionTurn: 1, skipClarify: false }),
    'ready',
  )
})

test('resolveQuickReplies maps 城市 to preset cities', () => {
  const replies = resolveQuickReplies(['城市'])
  assert.deepEqual(replies, ['北京', '上海', '广州', '深圳'])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/server/agent/clarify.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement clarify + quick replies**

```typescript
// src/server/agent/clarify.ts
import type { Step2DoneStatus } from '@/shared/step2-session-types'

type ClarifyInput = {
  missingInputs: string[]
  sessionTurn: 1 | 2 | 3
  skipClarify: boolean
}

export function resolveClarifyOutcome(input: ClarifyInput): Step2DoneStatus {
  if (input.missingInputs.length === 0) return 'ready'
  if (input.skipClarify) return input.sessionTurn >= 3 ? 'exhausted' : 'ready'
  if (input.sessionTurn >= 3) return 'exhausted'
  return 'clarifying'
}

export function buildClarifyQuestion(missingInputs: string[]): string {
  if (missingInputs.includes('城市')) return '需要哪个城市？'
  if (missingInputs.includes('网页链接')) return '请把网页链接发给我。'
  return `还可以补充：${missingInputs.join('、')}。`
}
```

```typescript
// src/server/agent/quick-replies.ts
const CITY_PRESETS = ['北京', '上海', '广州', '深圳'] as const

export function resolveQuickReplies(missingInputs: string[], agentReplies?: string[]): string[] {
  if (agentReplies?.length) return agentReplies.slice(0, 4)
  if (missingInputs.includes('城市')) return [...CITY_PRESETS]
  return []
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/server/agent/clarify.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/server/agent/clarify.ts src/server/agent/quick-replies.ts src/server/agent/clarify.test.ts
git commit -m "feat: add clarify routing and quick reply presets"
```

---

### Task 3: Extend graph streaming with progress + clarify short-circuit

**Files:**

- Modify: `src/server/agent/graph.ts`
- Modify: `src/server/agent/state.ts`
- Modify: `src/shared/market-types.ts` (add `confidenceLevel`)

- [ ] **Step 1: Extend `PocketStreamEvent` and `streamPocketGraph` signature**

Add parameters:

```typescript
export type Step2GraphInput = {
  sessionTurn: 1 | 2 | 3
  anchorPrompt: string
  priorMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  skipClarify?: boolean
}
```

Inside `streamPocketGraph`, after `classifierNode`:

```typescript
yield { type: 'progress', stage: 'understanding' }
// ... existing classify ...
yield { type: 'progress', stage: 'constraining' }
yield { type: 'progress', stage: 'recalling' }
yield { type: 'progress', stage: 'ranking' }

const outcome = resolveClarifyOutcome({
  missingInputs: classifiedState.task_frame.missingInputs,
  sessionTurn: step2Input.sessionTurn,
  skipClarify: step2Input.skipClarify === true,
})

if (outcome === 'clarifying') {
  const question = buildClarifyQuestion(classifiedState.task_frame.missingInputs)
  const quickReplies = resolveQuickReplies(classifiedState.task_frame.missingInputs)
  yield { type: 'progress', stage: 'clarifying' }
  yield {
    type: 'clarify',
    question,
    missingInputs: classifiedState.task_frame.missingInputs,
    quickReplies,
  }
  yield {
    type: 'meta',
    selected_tool: classifiedState.selected_tool,
    ui_payload: classifiedState.ui_payload,
  }
  yield {
    type: 'done',
    text: question,
    step2Status: 'clarifying',
    selected_tool: classifiedState.selected_tool,
    ui_payload: classifiedState.ui_payload,
  }
  return
}

const lowConfidence = outcome === 'exhausted' || step2Input.skipClarify === true
const uiPayload = {
  ...classifiedState.ui_payload,
  confidenceLevel: lowConfidence ? 'low' : 'normal',
}
// continue toolNode + responseNode, yield progress:ready, done with step2Status: outcome
```

- [ ] **Step 2: Update `createInitialState` to merge anchor + prior messages**

```typescript
messages: [
  ...priorMessages.map((m) => ({ role: m.role, content: m.content })),
  { role: 'user', content: input },
],
task_frame: buildTaskFrame(anchorPrompt || input, ...),
```

- [ ] **Step 3: Run typecheck**

Run: `yarn typecheck`  
Expected: PASS (fix any signature drift in `runPocketGraph` callers)

- [ ] **Step 4: Commit**

```bash
git add src/server/agent/graph.ts src/server/agent/state.ts src/shared/market-types.ts
git commit -m "feat: add clarify short-circuit and progress events to agent graph"
```

---

### Task 4: API route and client stream parser

**Files:**

- Modify: `src/app/api/chat/route.ts`
- Modify: `src/lib/client/llm.ts`

- [ ] **Step 1: Extend `ChatRequestBody` in route**

```typescript
type ChatRequestBody = {
  message?: string
  sessionTurn?: 1 | 2 | 3
  anchorPrompt?: string
  priorMessages?: Array<{ role: 'user' | 'assistant'; content: string }>
  skipClarify?: boolean
  answerBookFromPocket?: boolean
  explanationMode?: ExplanationMode
  builtinToolsEnabled?: boolean
}
```

Pass to `streamPocketGraph(message, ..., step2Input)`.

Only call `createRecommendationSession` when `done.step2Status === 'ready' || done.step2Status === 'exhausted'`.

- [ ] **Step 2: Extend `askQwen` options and stream parsing**

```typescript
export type AskQwenOptions = {
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
  // existing onMeta, onDelta
}

export type ChatReply = {
  text: string
  selectedTool: ChatToolPayload
  uiPayload: AgentUiPayload | null
  step2Status: Step2DoneStatus
}
```

Parse `progress`, `clarify`, and `done.step2Status` in the NDJSON loop.

- [ ] **Step 3: Run typecheck**

Run: `yarn typecheck`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/chat/route.ts src/lib/client/llm.ts
git commit -m "feat: wire Step2 session fields through chat API and client parser"
```

---

## Phase 2 — Frontend session + bottom interaction zone

### Task 5: Extend AnalysisFlow helpers and restart logic

**Files:**

- Modify: `src/components/discovery/analysis-stage-content.ts`
- Modify: `src/components/discovery/analysis-stage-content.test.ts`
- Modify: `src/hooks/analysis-stage-restart.ts`
- Modify: `src/hooks/analysis-stage-restart.test.ts`

- [ ] **Step 1: Write failing tests for clarifying input unlock**

```typescript
test('isInputLockedFlow returns false when step2 status is clarifying', () => {
  assert.equal(
    isInputLockedFlow({
      phase: 'analyzing',
      beat: 'working',
      step2: {
        turn: 1,
        anchorPrompt: '查天气',
        messages: [],
        status: 'clarifying',
        dialogueExpanded: false,
        quickReplies: ['北京'],
      },
    }),
    false,
  )
})
```

- [ ] **Step 2: Implement helpers**

```typescript
export function isStep2Clarifying(flow: AnalysisFlow): boolean {
  return flow.step2?.status === 'clarifying'
}

export function isInputLockedFlow(flow: AnalysisFlow): boolean {
  if (isStep2Clarifying(flow)) return false
  return flow.phase === 'analyzing'
}
```

Update `shouldRestartAnalysisFlow`: return `false` when `currentFlow.step2?.status === 'clarifying'` and `nextPrompt` is a continuation (not equal to anchor and not a new anchor from Step 1). Add helper `isStep2Continuation(currentFlow, nextPrompt, anchorPrompt)`.

- [ ] **Step 3: Run tests**

Run:

```bash
node --import tsx --test src/components/discovery/analysis-stage-content.test.ts
node --import tsx --test src/hooks/analysis-stage-restart.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/discovery/analysis-stage-content.ts src/components/discovery/analysis-stage-content.test.ts src/hooks/analysis-stage-restart.ts src/hooks/analysis-stage-restart.test.ts
git commit -m "feat: unlock input during Step2 clarifying and preserve flow on continuation"
```

---

### Task 6: useAnalysisSession — session lifecycle

**Files:**

- Modify: `src/hooks/use-analysis-session.ts`
- Modify: `src/hooks/use-voice-input.ts`

- [ ] **Step 1: Add session state and handlers**

Key changes in `useAnalysisSession`:

```typescript
const [step2Session, setStep2Session] = useState<Step2Session | null>(null)
const [progressStage, setProgressStage] = useState<ProgressStage | null>(null)

const runAgentTurn = useCallback(async (text: string, options?: RunTurnOptions) => {
  const isContinuation = step2Session?.status === 'clarifying'
  const session = isContinuation
    ? step2Session!
    : createStep2Session(safeText)

  const reply = await askQwen(isContinuation ? safeText : session.anchorPrompt, {
    sessionTurn: session.turn,
    anchorPrompt: session.anchorPrompt,
    priorMessages: session.messages,
    skipClarify: options?.skipClarify,
    onProgress: setProgressStage,
    onClarify: ({ question, quickReplies }) => { /* update session clarifying */ },
    onMeta: handleReplyMeta,
    onDelta: handleReplyDelta,
  })

  if (reply.step2Status === 'clarifying') {
    setStep2Session({
      ...appendStep2Turn(session, { user: safeText, assistant: reply.text }),
      status: 'clarifying',
      quickReplies: /* from clarify event */,
    })
    setAppState('idle') // input unlocked
    return
  }

  // ready / exhausted → trigger cover flow, advance to Step 3
}, [...])
```

Export: `step2Session`, `progressStage`, `skipToRecommendation`, `toggleDialogueExpanded`.

- [ ] **Step 2: Update voice input**

In `submitTextMessage` / `handleSpeechEnd`, pass through when `step2Session?.status === 'clarifying'` without clearing session.

Add `skipToRecommendation` calling `runAgentTurn('', { skipClarify: true })` or dedicated API flag with last user context.

- [ ] **Step 3: Run typecheck**

Run: `yarn typecheck`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-analysis-session.ts src/hooks/use-voice-input.ts
git commit -m "feat: manage Step2 session lifecycle in analysis hook"
```

---

### Task 7: DialoguePeek + Step2ActionRow + DoraBottomInteractionZone

**Files:**

- Create: `src/components/dialogue-peek.tsx`
- Create: `src/components/step2-action-row.tsx`
- Create: `src/components/dora-bottom-interaction-zone.tsx`
- Modify: `src/components/analysis-bottom-bar.tsx`
- Modify: `src/components/analysis-stage-panel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/hooks/use-analysis-page-controller.ts`
- Modify: `src/shared/ui-copy.ts`

- [ ] **Step 1: Implement DialoguePeek (strategy A)**

```tsx
// src/components/dialogue-peek.tsx
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
          className="text-[11px] font-semibold text-primary"
        >
          展开 earlier ▾
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
```

- [ ] **Step 2: Implement Step2ActionRow**

Quick reply chips call `onQuickReply(text)`; skip button calls `onSkipRecommendation`.

- [ ] **Step 3: Implement DoraBottomInteractionZone**

```tsx
export function DoraBottomInteractionZone(props: DoraBottomInteractionZoneProps) {
  const showActionRow = props.step2Session?.status === 'clarifying' || props.step2Session?.status === 'thinking'
  const inputLocked = isInputLockedFlow(props.analysisFlow) && !isStep2Clarifying(props.analysisFlow)

  return (
    <div className="shrink-0 max-h-[min(38vh,240px)] overflow-hidden border-t border-white/60 bg-white/78 backdrop-blur-md">
      <DialoguePeek ... />
      {showActionRow ? <Step2ActionRow ... /> : null}
      {props.appState === 'speaking' ? <DoraVoicePlaybackBar ... /> : null}
      {props.analysisFlow.phase === 'analyzing' && !isStep2Clarifying(props.analysisFlow) ? (
        <PocketDiggingBar analysisFlow={props.analysisFlow} />
      ) : (
        <AnalysisInputComposer locked={inputLocked} ... />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Update AnalysisStagePanel canvas wrapper**

```tsx
<div className="relative min-h-0 flex-1 min-h-[18rem]">
  <AnalysisStageCanvas />
</div>
```

- [ ] **Step 5: Wire App.tsx** — pass `step2Session`, `progressStage`, handlers to zone via controller.

- [ ] **Step 6: Run lint + typecheck**

Run: `yarn lint && yarn typecheck`  
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/dialogue-peek.tsx src/components/step2-action-row.tsx src/components/dora-bottom-interaction-zone.tsx src/components/analysis-bottom-bar.tsx src/components/analysis-stage-panel.tsx src/App.tsx src/hooks/use-analysis-page-controller.ts src/shared/ui-copy.ts
git commit -m "feat: add Dora bottom interaction zone with DialoguePeek strategy A"
```

---

### Task 8: Step 3 low-confidence banner

**Files:**

- Modify: `src/components/discovery/primary-recommendation-card.tsx` (or `compact-decision-panel.tsx`)

- [ ] **Step 1: Show banner when `payload.confidenceLevel === 'low'`**

```tsx
{
  payload?.confidenceLevel === 'low' ? (
    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      部分条件未确认，推荐置信度偏低。你可以返回 Step 2 补充。
    </p>
  ) : null
}
```

- [ ] **Step 2: Manual smoke test**

Run: `yarn dev`  
Cases:

1. 输入「查天气」→ 应 clarify 追问城市，底部显示 chips，Canvas 不缩小
2. 点「北京」→ 自动进 Step 3
3. 点「跳过，先看推荐」→ Step 3 带 low-confidence 提示

- [ ] **Step 3: Commit**

```bash
git add src/components/discovery/primary-recommendation-card.tsx
git commit -m "feat: show low-confidence hint when recommendation skipped clarify"
```

---

## Phase 3 — Progress-driven left Track

### Task 9: Wire progress stage to LiveAnalysisTrack

**Files:**

- Modify: `src/components/discovery/analysis-stage-content.ts`
- Modify: `src/components/discovery/live-analysis-track-card.tsx`
- Modify: `src/components/discovery-workspace.tsx`
- Modify: `src/hooks/use-analysis-page-controller.ts`

- [ ] **Step 1: Write failing test for progress-based active index**

```typescript
test('resolveActiveTrackIndexFromProgress marks constraining active during clarifying', () => {
  assert.equal(resolveActiveTrackIndexFromProgress('clarifying'), 1)
})
```

- [ ] **Step 2: Add `resolveActiveTrackIndexFromProgress(stage: ProgressStage | null)`**

Map per spec section 7 table; prefer `progressStage` over `appState` when present.

- [ ] **Step 3: Pass `progressStage` from controller → DiscoveryWorkspace → LiveAnalysisTrackCard**

- [ ] **Step 4: Run tests + typecheck**

Run:

```bash
node --import tsx --test src/components/discovery/analysis-stage-content.test.ts
yarn typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/discovery/analysis-stage-content.ts src/components/discovery/analysis-stage-content.test.ts src/components/discovery/live-analysis-track-card.tsx src/components/discovery-workspace.tsx src/hooks/use-analysis-page-controller.ts
git commit -m "feat: drive LiveAnalysisTrack from backend progress stages"
```

---

## Spec Coverage Self-Review

| Spec requirement               | Task                   |
| ------------------------------ | ---------------------- |
| Step 2 ≤3 轮，对话在右侧底部栏 | Task 6, 7              |
| Canvas 不压缩                  | Task 7 (max-h + min-h) |
| DialoguePeek 策略 A            | Task 7                 |
| 缺参 clarify + chips           | Task 2, 3, 7           |
| 收束规则 C                     | Task 2, 3, 6           |
| 跳过 + 降置信度                | Task 3, 6, 8           |
| 第 3 轮强制 Step 3             | Task 2, 3              |
| Progress 驱动 Track            | Task 9                 |
| 续聊不 restart                 | Task 5                 |
| 新任务清空 session             | Task 6                 |
| Phase 4 token 流 + HITL        | Out of scope           |

---

## Manual Verification Checklist

- [ ] 「查天气」→ clarify → 选城市 → Step 3 自动揭晓
- [ ] 「查天气」→ 跳过 → Step 3 低置信度提示
- [ ] 连续 3 轮仍缺参 → 强制 Step 3
- [ ] 右侧 DialoguePeek 默认 2 条，可展开 earlier
- [ ] 分析中 Canvas 高度稳定
- [ ] 左侧 Track 阶段与后端 progress 一致
- [ ] Step 1 新任务清空上一轮 session
