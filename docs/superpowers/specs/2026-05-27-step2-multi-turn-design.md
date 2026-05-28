# Step 2 多轮分析工作流设计

> 状态：已批准  
> 日期：2026-05-27  
> 范围：P0-1（Step 2 会话）、P0-2（缺参澄清）、P0-3 L1（Progress 事件）、右侧底部栏对话 UI

---

## 1. 已锁定产品决策

| #   | 决策         | 结论                                                                         |
| --- | ------------ | ---------------------------------------------------------------------------- |
| D1  | 多轮深度     | Step 2 内 ≤3 轮短对话（纠偏 + 补条件）                                       |
| D2  | 思考可见性   | 结构化思考过程仅在**左侧 Step 2**（LiveAnalysisTrack）                       |
| D3  | 对话位置     | 全部在**右侧底部栏**，不占用 Canvas 区域                                     |
| D4  | Canvas       | 保持完整展示，`min-h` 保底，不因对话压缩                                     |
| D5  | 收束规则     | **C 混合**：就绪自动进 Step 3；任意时刻可「跳过，先看推荐」；第 3 轮强制收束 |
| D6  | DialoguePeek | **A**：默认仅展示最后一轮（2 条消息），更早内容通过「展开 earlier」查看      |

---

## 2. 左右分工

```
┌─ 左侧 DiscoveryWorkspace ──────────┐  ┌─ 右侧 AnalysisStagePanel ────────┐
│ Step1: 任务入口 / 场景草稿          │  │ StatusBar                        │
│ Step2: LiveAnalysisTrack ONLY      │  │                                  │
│        (progress 事件驱动)          │  │ Canvas (3D 哆啦, flex-1, min-h)  │
│ Step3: 主推荐 + 备选               │  │                                  │
│                                    │  │ DoraBottomInteractionZone        │
│                                    │  │  ├ DialoguePeek (scroll, capped) │
│                                    │  │  ├ ActionRow (chips / skip)      │
│                                    │  │  └ InputSurface                  │
└────────────────────────────────────┘  └──────────────────────────────────┘
```

**原则：用户在右侧「跟哆啦说」，在左侧「看哆啦怎么想的」。**

---

## 3. 状态模型

### 3.1 Step2Session

```typescript
type Step2Message = { role: 'user' | 'assistant'; content: string }

type Step2Session = {
  turn: 1 | 2 | 3
  anchorPrompt: string
  messages: Step2Message[] // 最多 6 条（3 轮 × 2）
  status: 'thinking' | 'clarifying' | 'ready' | 'exhausted'
  dialogueExpanded: boolean // DialoguePeek「展开 earlier」
}
```

### 3.2 AnalysisFlow 扩展

```typescript
type AnalysisFlow = {
  phase: 'idle' | 'analyzing' | 'revealed'
  beat: 'working' | 'cover' | 'reveal'
  step2?: Step2Session // phase === 'analyzing' 时存在
}
```

### 3.3 状态流转

```
用户提交任务 (turn=1)
  → step2.status = thinking
  → Agent 返回
      ├─ missingInputs 且 turn<3 且 !skipClarify → clarifying（留 Step 2，解锁输入）
      ├─ missingInputs 且 (turn=3 或 skipClarify) → exhausted → 强制 Step 3
      └─ 无 missingInputs → ready → 自动 cover → Step 3

用户补充 (turn+1) → 重新 classifier，重复上述判断
用户点「跳过，先看推荐」→ 带当前 payload 进 Step 3（降置信度标记）
用户从 Step 1 发起全新任务 → 清空 session，turn=1
```

---

## 4. 收束规则 C（详细）

| 场景                 | 左侧                         | 右侧底部栏                            |
| -------------------- | ---------------------------- | ------------------------------------- |
| 首轮无 missingInputs | Track 全 done → 自动 Step 3  | DialoguePeek 显示 Dora 收束语 → cover |
| 有 missingInputs     | Track 停在「提取限制」active | Dora 追问 + chips + 输入解锁          |
| 用户补充且 cleared   | 自动 Step 3                  | 显示「好，我来出手」                  |
| 任意时刻点「跳过」   | 降置信度进 Step 3            | ActionRow 按钮                        |
| turn=3 仍缺参        | exhausted → 强制 Step 3      | 提示「先按现有信息推荐」              |

Step 3 降置信度提示文案：

> 部分条件未确认，推荐置信度偏低。你可以返回 Step 2 补充。

---

## 5. 右侧底部栏：`DoraBottomInteractionZone`

### 5.1 布局约束

```tsx
// AnalysisStagePanel 结构
<StatusBar />                                    // shrink-0
<div className="flex-1 min-h-[18rem]">           // Canvas 保底
  <AnalysisStageCanvas />
</div>
<DoraBottomInteractionZone
  className="shrink-0 max-h-[min(38vh,240px)] overflow-hidden"
/>
```

### 5.2 子组件

| 组件           | 职责                                                                        |
| -------------- | --------------------------------------------------------------------------- |
| `DialoguePeek` | 对话摘要；默认最后一轮；`dialogueExpanded` 时展示全部；内部 `max-h-28` 滚动 |
| `ActionRow`    | quick reply chips；「跳过，先看推荐」（Step 2 可见）                        |
| `InputSurface` | `Composer` / `DiggingBar` / `VoiceBar` 三态                                 |

### 5.3 InputSurface 分支

| 条件                | 展示                                              |
| ------------------- | ------------------------------------------------- |
| Step 2 `clarifying` | `AnalysisInputComposer`（解锁）                   |
| Step 2 `thinking`   | `PocketDiggingBar` 精简单行（输入暂锁）           |
| Step 3 cover/reveal | `PocketDiggingBar`（现有）                        |
| `speaking`          | `DoraVoicePlaybackBar`（文案同步至 DialoguePeek） |
| idle / Step 1       | `AnalysisInputComposer`                           |

### 5.4 DialoguePeek 展示规则（策略 A）

- **默认**：仅 `messages` 最后 2 条（一轮 user + assistant）
- **turn > 1 且未展开**：显示「展开 earlier ▾」按钮
- **展开后**：展示全部 messages（≤6 条），区域内滚动
- **流式 delta**：更新最后一条 assistant 内容

---

## 6. API / Agent 协议

### 6.1 请求扩展

```typescript
type ChatRequestBody = {
  message: string
  sessionTurn: 1 | 2 | 3
  anchorPrompt: string
  priorMessages: Step2Message[]
  skipClarify?: boolean
  // existing: answerBookFromPocket, explanationMode, builtinToolsEnabled
}
```

### 6.2 流式事件扩展

```typescript
type PocketStreamEvent =
  | {
      type: 'progress'
      stage: 'understanding' | 'constraining' | 'recalling' | 'ranking' | 'clarifying' | 'ready'
    }
  | { type: 'clarify'; question: string; missingInputs: string[]; quickReplies?: string[] }
  | { type: 'meta'; selected_tool; ui_payload }
  | { type: 'delta'; text: string }
  | {
      type: 'done'
      step2Status: 'ready' | 'clarifying' | 'exhausted'
      text
      selected_tool
      ui_payload
    }
  | { type: 'error'; error: string }
```

### 6.3 Agent 路由

```
classifierNode 完成后：
  IF missingInputs.length > 0 AND sessionTurn < 3 AND NOT skipClarify
    → yield progress:clarifying + clarify event
    → 不进入 responseNode，done.step2Status = 'clarifying'
  ELSE IF missingInputs.length > 0 AND (sessionTurn === 3 OR skipClarify)
    → 降置信度，继续 ranking + responseNode
    → done.step2Status = 'exhausted' 或 'ready'
  ELSE
    → ranking + responseNode
    → done.step2Status = 'ready'
```

### 6.4 上下文注入

- `anchorPrompt` 作为 task anchor（system / task frame）
- `priorMessages` + 当前 `message` 注入 classifier 与 response
- Token 预算：prior 最多 4 条 + 当前 1 条

### 6.5 quickReplies 来源

- **预设**：`missingInputs` 类型映射（如「城市」→ 北京/上海/广州/深圳）
- **Agent 生成**：`clarify` 事件中的 `quickReplies` 优先覆盖预设
- 用户点 chip = 等同提交该文本，触发 turn+1

---

## 7. Progress 与左侧 Track 对齐（P0-3 L1）

| progress stage  | Track 轨道          |
| --------------- | ------------------- |
| `understanding` | 理解任务 → active   |
| `constraining`  | 提取限制 → active   |
| `recalling`     | 收束候选 → active   |
| `ranking`       | 收束候选 → active   |
| `clarifying`    | 提取限制保持 active |
| `ready`         | 三轨全部 done       |

Track 的 active/done **跟随后端 progress 事件**，不再依赖纯前端 timer。

---

## 8. 前端逻辑改动清单

| 文件                              | 改动                                                  |
| --------------------------------- | ----------------------------------------------------- |
| `analysis-bottom-bar.tsx`         | 重构为 `DoraBottomInteractionZone`                    |
| `analysis-stage-panel.tsx`        | Canvas `min-h`；接入新底部组件                        |
| `use-analysis-session.ts`         | `step2Session` 状态；区分新任务 / 续聊；messages 累积 |
| `use-analysis-page-controller.ts` | Step 2 clarifying 不锁输入；传 session 给 App         |
| `use-voice-input.ts`              | 续聊时保留 anchor，不 clear session                   |
| `analysis-stage-content.ts`       | 扩展 `AnalysisFlow`；新增 clarifying 相关 helpers     |
| `analysis-stage-restart.ts`       | Step 2 续聊不 restart；仅新任务 restart               |
| `App.tsx`                         | wiring step2Session → 底部栏                          |
| `lib/client/llm.ts`               | 请求/流式解析 progress + clarify                      |
| `app/api/chat/route.ts`           | 透传 session 字段                                     |
| `server/agent/graph.ts`           | clarify 分支 + progress yields                        |

**删除 / 不做：**

- `DoraDialoguePanel`（Canvas 与 StatusBar 之间）— 不实现
- 左侧 Step 2 对话 UI — 不实现

---

## 9. P0-4 HITL（本 spec 范围外，默认策略）

- 确认弹窗仅在 Step 3 行动点（打开外部工具、内置 tool 执行）
- Step 2 不执行任何工具
- 默认 **Confirm-external**（外部 + 内置执行需确认）

---

## 10. 实施分期

| 阶段        | 内容                                                              |
| ----------- | ----------------------------------------------------------------- |
| **Phase 1** | Step2Session 状态机 + API 扩展 + 收束规则 C + clarify 路由        |
| **Phase 2** | `DoraBottomInteractionZone` + DialoguePeek + ActionRow + 输入解锁 |
| **Phase 3** | progress 事件 + 左侧 Track 真实驱动                               |
| **Phase 4** | response 真 token 流（P0-3 L2）+ HITL（P0-4）                     |

---

## 11. 验收标准

- [ ] Step 2 内可进行最多 3 轮澄清，对话仅在右侧底部栏展示
- [ ] Canvas 区域高度不因对话增加而明显压缩（底部栏封顶 240px/38vh）
- [ ] DialoguePeek 默认只显示最后一轮，可展开查看历史
- [ ] 缺参时 Dora 追问 + quick chips，补充后自动进 Step 3
- [ ] 「跳过，先看推荐」任意时刻可用，Step 3 显示降置信度提示
- [ ] 第 3 轮仍缺参时强制进 Step 3
- [ ] 左侧 Track 与后端 progress 阶段同步
- [ ] 新任务从 Step 1 提交时清空 session；Step 2 续聊不重启 Track
