# /analyse 布局 Dock + 语音 Fab 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 左侧固定「交互底栏」承载步进/澄清/按需文字；右侧仅保留 3D 舞台 + 圆形语音 Fab；移除右侧 `AnalysisBottomBar`。

**Architecture:** 将 `StarterWizard` 的 `intake` + `wizardSubStep` 提升到 `DiscoveryWorkspace`；新建 `AnalysisInteractionDock` 按 `activePanelStep` 切换 UI；`StageVoiceFab` 复用 `useVoiceInput`，经 controller 包装 `runAgentTurn` 实现语音冷启动（B）。语音 prompt 用 `composeStarterPromptFromVoice(intake, transcript)` 合并已选约束。

**Tech Stack:** Next.js App Router、React 19、Zustand（现有 session store）、Tailwind、现有 `useVoiceInput` / `use-analysis-page-controller`

**Spec:** [docs/superpowers/specs/2026-06-03-analyse-layout-dock-design.md](../specs/2026-06-03-analyse-layout-dock-design.md)

---

## 改动范围与难度

| 模块             | 文件（约）                                                         | 难度     | 风险              |
| ---------------- | ------------------------------------------------------------------ | -------- | ----------------- |
| 语音 prompt 合并 | `starter-intake.ts` + test                                         | ★★☆      | 低                |
| 向导状态提升     | `discovery-workspace.tsx`, `starter-wizard.tsx`, 子 step 组件      | ★★★★     | 中：props 链变长  |
| 左侧 Dock        | 新建 `analysis-interaction-dock.tsx`                               | ★★★★     | 中：显隐矩阵      |
| 右侧 Fab         | 新建 `stage-voice-fab.tsx`, `analysis-stage-panel.tsx`             | ★★☆      | 低                |
| App 接线         | `App.tsx`, `use-analysis-page-controller.ts`, `use-voice-input.ts` | ★★★      | 中：语音 B 分支   |
| 清理             | `where-to-start-section.tsx`, 可选弃用 `analysis-bottom-bar.tsx`   | ★★☆      | 低                |
| **合计**         | **~12 改 + 3 新建**                                                | **中高** | **1.5～2.5 人日** |

**不改动：** LangGraph、`/api/chat` schema、Prisma、`/market`。

---

## 文件职责表

| 文件                                                                 | 操作     | 职责                                                     |
| -------------------------------------------------------------------- | -------- | -------------------------------------------------------- |
| `src/shared/starter-intake.ts`                                       | 修改     | 新增 `composeStarterPromptFromVoice`                     |
| `src/shared/starter-intake.test.ts`                                  | 修改     | 覆盖语音合并                                             |
| `src/components/discovery/analysis-interaction-dock.tsx`             | **新建** | 左底栏：Step1 步进 / Step2 会话 UI / Step3 新任务        |
| `src/components/discovery/starter-wizard/starter-wizard-content.tsx` | **新建** | 仅 4 个子步内容（从 wizard 拆出）                        |
| `src/components/discovery/starter-wizard/starter-wizard.tsx`         | 修改     | 瘦身为 content-only 或删除由 workspace 直接引 content    |
| `src/components/analysis/stage-voice-fab.tsx`                        | **新建** | 圆形 Mic，pointer 事件                                   |
| `src/components/analysis-stage-panel.tsx`                            | 修改     | 移除 `children`；渲染 `StageVoiceFab`                    |
| `src/components/discovery-workspace.tsx`                             | 修改     | 持有 intake/step；Scroll + Dock 布局                     |
| `src/components/discovery/where-to-start-section.tsx`                | 修改     | 去掉内嵌 wizard 按钮区；无「新任务」重复（与 Dock 去重） |
| `src/App.tsx`                                                        | 修改     | BottomBar props → Workspace；Stage 传 Fab handlers       |
| `src/hooks/use-analysis-page-controller.ts`                          | 修改     | `runAgentTurnForVoice`；`getStarterIntakeRef`            |
| `src/components/analysis-input-composer.tsx`                         | 修改     | 可选 prop `hideVoiceToggle`（左侧仅文字）                |
| `src/components/dora-bottom-interaction-zone.tsx`                    | 修改     | 拆出可复用块或供 Dock import（Step2 逻辑）               |
| `docs/superpowers/specs/2026-06-03-analyse-layout-dock-design.md`    | 修改     | 状态 → 已实现                                            |

**保留但不挂 App：** `analysis-bottom-bar.tsx` 可删或留空壳（YAGNI 建议执行后删除）。

---

## 语音 Prompt 规则（PLAN 定稿）

```ts
// composeStarterPromptFromVoice(intake, voiceText)
// - roleId / constraintIds 来自 intake（可为空）
// - task 行 = voiceText.trim()
// - outcomeId 忽略（语音优先）
// - 复用 composeStarterPrompt({ ...intake, outcomeId: null, customTask: voiceText })
```

`displayPrompt` = `voiceText.trim()`。

---

## 分阶段实施（降低回归）

### Phase A：骨架 + Step1 Dock（可独立验证）

### Phase B：迁 Step2 会话 UI 到左 Dock

### Phase C：右侧 Fab + 语音 B

### Phase D：Step3 + 去重 + 文档

---

### Task 1: 语音冷启动 prompt 函数

**Files:**

- Modify: `src/shared/starter-intake.ts`
- Modify: `src/shared/starter-intake.test.ts`

- [ ] 在 `starter-intake.ts` 新增 `composeStarterPromptFromVoice(intake, voiceText: string)`
- [ ] 单测：有 role+constraint + 语音 → 【冷启动】含身份/约束/语音任务行
- [ ] 单测：空 intake + 语音 → 仍可 compose
- [ ] `node --import tsx --test src/shared/starter-intake.test.ts`

---

### Task 2: 提升向导状态到 DiscoveryWorkspace

**Files:**

- Modify: `src/components/discovery-workspace.tsx`
- Modify: `src/components/discovery/starter-wizard/starter-wizard.tsx`
- Create: `src/components/discovery/starter-wizard/starter-wizard-content.tsx`（从 wizard 抽出 4 步 UI，无底部按钮）

- [ ] `DiscoveryWorkspace` 内 `useState<StarterIntake>` + `useState<StarterWizardStep>(1)`
- [ ] 将 `selectRole` / `toggleConstraint` / `selectOutcome` / `handleCustomTaskChange` 逻辑迁入 workspace 或 `useStarterWizardState.ts` hook
- [ ] `StarterWizard` 改为接收 `intake` + callbacks 的纯展示组件（或删除，直接用 `StarterWizardContent`）
- [ ] 移除 `starter-wizard.tsx` 底部 `handleStart` / 步进按钮区
- [ ] `WhereToStartSection` 只渲染 `StarterWizardContent` + 思考说明；**移除**顶部「开始新任务」按钮（改由 Dock 承担，见 Task 5）

---

### Task 3: 新建 AnalysisInteractionDock（Step 1 + 占位）

**Files:**

- Create: `src/components/discovery/analysis-interaction-dock.tsx`
- Modify: `src/components/discovery-workspace.tsx`

- [ ] Dock 外壳：`shrink-0 border-t ...`，始终渲染
- [ ] `activePanelStep === 1`：`上一步` / `下一步 →` / `开始分析`（逻辑同原 wizard，`canAdvanceStarterStep`）
- [ ] `wizardSubStep === 4` 显示「开始分析」，否则显示 `nextLabel`
- [ ] `开始分析` 调用 `onStartAnalysis(composeStarterPrompt(intake), resolveStarterDisplayGoal(intake))`
- [ ] `actionsEnabled === false` 时 Dock 显示「开始新任务」单按钮（`onStartNewTask`）
- [ ] `DiscoveryWorkspace`：`DisplayPanel` 内 `flex flex-col` → `ScrollArea flex-1` + `AnalysisInteractionDock`
- [ ] 手动验证：Step1 步进仍正常，右侧 BottomBar **暂时保留**（本 task 不删）

---

### Task 4: 迁移 Step2 会话 UI 到 Dock

**Files:**

- Modify: `src/components/discovery/analysis-interaction-dock.tsx`
- Modify: `src/components/dora-bottom-interaction-zone.tsx` 或拆 `analysis-session-dock-panel.tsx`
- Modify: `src/components/analysis-input-composer.tsx`（`hideVoiceToggle?: boolean`）

- [ ] `activePanelStep === 2`：渲染原 `DoraBottomInteractionZone` 核心块（DialoguePeek、Step2ActionRow、DiggingBar、VoicePlaybackBar）
- [ ] Step2 显示 `AnalysisInputComposer` 且 **`hideVoiceToggle={true}`**（语音仅右侧 Fab）
- [ ] Step2 **不显示** 向导步进按钮
- [ ] 从 `App.tsx` **移除** `AnalysisBottomBar` 及全部 props
- [ ] 将原 BottomBar props 经 `App` → `DiscoveryWorkspace` → `AnalysisInteractionDock`
- [ ] 手动验证：澄清 chips、文字发送、skip、挖口袋条均在**左底**

---

### Task 5: StageVoiceFab + 语音 B

**Files:**

- Create: `src/components/analysis/stage-voice-fab.tsx`
- Modify: `src/components/analysis-stage-panel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/hooks/use-analysis-page-controller.ts`

- [ ] `StageVoiceFab`：圆形按钮，`onPointerDown`/`Up`/`Cancel` 接 `holdToTalkStart/End/Cancel`
- [ ] `listening` 时样式高亮；`disabled` 当 `appState === 'thinking'` 或 `speaking`（与现 input locked 一致）
- [ ] `AnalysisStagePanel`：删除 `{children}`；在舞台区下缘渲染 `StageVoiceFab`
- [ ] `DiscoveryWorkspace` 通过 `useImperativeHandle` 或 ref 暴露 `getStarterIntake()`；controller 保存 `workspaceRef`
- [ ] `use-analysis-page-controller` 包装传给 `useVoiceInput` 的 `runAgentTurn`：
  - 若 `!currentPrompt` → `composeStarterPromptFromVoice(getIntake(), text)` + `displayPrompt: text`
  - 否则 → `runAgentTurn(text, { isContinuation: true })`（或现有 continuation 规则）
- [ ] 手动验证：Step1 未点开始分析时，按住 Fab 说话 → 直接进 Step2 分析

---

### Task 6: Step3 Dock + 去重 + 清理

**Files:**

- Modify: `analysis-interaction-dock.tsx`
- Modify: `where-to-start-section.tsx`
- Delete（可选）: `src/components/analysis-bottom-bar.tsx`

- [ ] `activePanelStep === 3`：Dock 仅「开始新任务」（与 spec Phase2 一致，不加追问输入）
- [ ] `WhereToStartSection` 在 `!actionsEnabled` 时只显示文案，**按钮移至 Dock**（避免两处「开始新任务」）
- [ ] 删除未使用的 `AnalysisBottomBar` import
- [ ] `npm run typecheck`
- [ ] `node --import tsx --test src/shared/starter-intake.test.ts src/server/agent/task-frame.test.ts`

---

### Task 7: 文档与 spec 状态

**Files:**

- Modify: `docs/superpowers/specs/2026-06-03-analyse-layout-dock-design.md`

- [ ] 在 spec 末尾增加「实现状态」与计划链接
- [ ] 更新 `docs/competitive-analysis-ai-suggests.md` 一行：布局双通道已落地

---

## 验收清单（与 spec §9 对齐）

- [ ] 右侧无长输入条，有 3D + 圆形语音 Fab
- [ ] 左侧每步底部有 Dock；Step1 有上一步/下一步/开始分析
- [ ] Step1 语音（B）可直接分析；左侧开始分析仍可用
- [ ] Step2 澄清/文字/摘要在左 Dock
- [ ] `currentPrompt` 仍为短任务句
- [ ] typecheck + 单测通过

---

## 风险与缓解

| 风险                                 | 缓解                                                  |
| ------------------------------------ | ----------------------------------------------------- |
| props 爆炸（App → Workspace → Dock） | 引入 `AnalysisDockProps` 类型单文件导出               |
| Step1 语音与「开始分析」双开         | `beginAgentTurn` + `thinking` 时禁用 Fab 与 Dock 按钮 |
| `getStarterIntake` 读不到最新值      | ref + workspace `useImperativeHandle` 或 zustand 切片 |
| 左 Composer 仍显示 Mic 切换          | `hideVoiceToggle` 强制 false 隐藏                     |

---

## IMPLEMENTATION CHECKLIST（执行顺序）

1. `composeStarterPromptFromVoice` + 单测
2. 状态提升至 `DiscoveryWorkspace`；wizard 去掉底部按钮
3. 新建 `AnalysisInteractionDock`（Step1）并接入 workspace 布局
4. 迁移 Step2 UI 到 Dock；`App.tsx` 移除 `AnalysisBottomBar`
5. 新建 `StageVoiceFab`；`analysis-stage-panel` 去 children
6. controller 包装语音 `runAgentTurn`（B）
7. Step3 Dock + 去重「开始新任务」
8. typecheck + 单测 + 手动冒烟（Step1 步进 / 语音开工 / Step2 澄清 / 新任务）
9. 更新 spec 实现状态

---

**下一步：** 用户发送 `ENTER EXECUTE MODE` 后按 CHECKLIST 1→9 实施，默认 **不** 提交 git。
