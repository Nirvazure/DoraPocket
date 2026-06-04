# /analyse 布局重构：左侧交互底栏 + 右侧纯 3D 与语音 Fab

> 日期：2026-06-03  
> 状态：已脑暴确认（用户回复「认可」）  
> 关联：`starter-intake` 冷启动向导、竞品 AISuggests Find 启发

---

## 1. 背景与目标

### 问题

- 左侧已有「这次想完成什么」等结构化冷启动，与右侧 `AnalysisBottomBar` 的首句输入**职责重叠**，用户不知在哪描述任务。
- 右侧同时承担 3D 表演 + 长输入条 + 澄清 UI，**信息流与交互混在两侧**。

### 目标

帮助用户在**当前任务**下找到**最合适、值得先试**的工具（Agent 裁决 + 行动闭环不变）。

### 产品模型（定稿）

| 通道   | 形态                                   | 心智                          |
| ------ | -------------------------------------- | ----------------------------- |
| **左** | 点选、步进确认、按步显隐的文字、chips  | 「把条件和选择说清楚」        |
| **右** | 3D 哆啦 + **圆形语音 Fab**（全程可见） | 「像跟 Agent 多轮会话一样说」 |

**语音冷启动规则（B）：** Step 1 未点「开始分析」时，语音转写完成 → **直接 `runAgentTurn`**；左侧已选 role/constraints 合并进 prompt，但不强制走完向导。

---

## 2. 信息架构

```
┌─ 左 DiscoveryWorkspace ──────────────────────────┐
│  DecisionProgressSteps (1·2·3)                    │
│  ┌─ ScrollArea：本步内容（无内嵌步进按钮）────────┐ │
│  │ Step1: StarterWizard 内容页 only              │ │
│  │ Step2: LiveAnalysisTrackCard                  │ │
│  │ Step3: CompactDecisionPanel                   │ │
│  └───────────────────────────────────────────────┘ │
│  ┌─ AnalysisInteractionDock（每步固定底部）──────┐ │
│  │ 随 step 切换：步进 / 文字 / chips / 状态条    │ │
│  └───────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘

┌─ 右 AnalysisStagePanel ───────────────────────────┐
│  AnalysisStageStatusBar                           │
│  AnalysisStageCanvas（flex-1，3D）                │
│  StageVoiceFab（圆形 Mic，固定舞台下缘）          │
└───────────────────────────────────────────────────┘
```

**移除：** `App.tsx` 中 `AnalysisStagePanel` 的 `children` → `AnalysisBottomBar`。

---

## 3. 组件边界

| 组件                      | 职责                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `StarterWizard`           | 仅渲染各子步**内容**（角色网格、outcome 列表、约束、确认摘要）；**不**渲染底部步进按钮      |
| `AnalysisInteractionDock` | 左侧固定底栏；根据 `analysisStep` + `wizardSubStep` + `step2Session` + `appState` 决定子 UI |
| `StageVoiceFab`           | 右侧圆形按住说话；全程可见；接线 `useVoiceInput` / `holdToTalk`                             |
| `DiscoveryWorkspace`      | 组合 Scroll + Dock；持有或消费 `StarterIntake` + `wizardSubStep` 状态                       |
| `AnalysisStagePanel`      | 仅舞台 + 状态条 + Fab；无 `children` 输入区                                                 |

**状态提升（推荐）：** `wizardSubStep`、`StarterIntake` 从 `StarterWizard` 提升到 `DiscoveryWorkspace`（或 `StarterWizardContext`），供 Dock 与 Fab 共用。

---

## 4. AnalysisInteractionDock 按步规范

### Step 1（`activePanelStep === 1`）

| 元素                       | 显示                                                        |
| -------------------------- | ----------------------------------------------------------- |
| 上一步 / 下一步 / 开始分析 | 始终（绑定 `canAdvanceStarterStep`）                        |
| 文字输入                   | **默认隐藏**；任务收集在滚动区（outcome + 内容区 textarea） |
| 开始分析                   | `composeStarterPrompt` → `handleStartStructuredAnalysis`    |

向导子步 1–4 与现 `StarterWizardStep` 一致；底栏「下一步」文案随子步变化（`nextToOutcome` 等）。

### Step 2（`activePanelStep === 2`）

| 元素                                 | 显示条件                                |
| ------------------------------------ | --------------------------------------- |
| 步进按钮（上一步/下一步）            | **隐藏**                                |
| `DialoguePeek`                       | `step2Session` 有对话                   |
| `Step2ActionRow`                     | 澄清中或 thinking+skip                  |
| `AnalysisInputComposer`（文字+发送） | 澄清需补一句 / 非 locked                |
| `PocketDiggingBar`                   | 分析中且非澄清                          |
| `DoraVoicePlaybackBar`               | speaking 且有播报（或精简为舞台侧提示） |

**不显示：** 右侧原位置上述组件。

### Step 3（`activePanelStep === 3`）

| 元素   | 显示                                                              |
| ------ | ----------------------------------------------------------------- |
| 主行动 | 仍在 `CompactDecisionPanel` 卡片上                                |
| 底栏   | **开始新任务**（`onStartNewTask`）；追问文字输入 **Phase 2 可选** |

### `actionsEnabled === false`（已有分析结果）

滚动区显示「开始新任务」说明；Dock 可仅保留 **开始新任务** 或与现 `WhereToStartSection` 顶部按钮二选一（实现时去重，只保留一处）。

---

## 5. StageVoiceFab 与语音数据流（B）

### 可见性

- **全程可见**（含 Step 1 向导），包括 `appState === 'idle'` 且无 `currentPrompt`。

### Step 1 无会话

1. 用户按住 Fab → `listening` → 转写文本 `text`
2. 读取当前 `StarterIntake`（若用户已点选 role/constraints，合并进 prompt）
3. 调用 `runAgentTurn(mergedPrompt, { displayPrompt: text })`
   - `mergedPrompt` 实现建议：若有 intake 则 `composeStarterPrompt(intake)` 与纯语音二选一 **或** 语音为主、intake 作附加行（实现 PLAN 定一种，默认 **语音原文为 task 行**，已选约束仍写入【冷启动】块）
4. **不**要求用户再点「开始分析」

### Step 2+ 有会话

- 与现 `useVoiceInput` → `runAgentTurn(text, { isContinuation: true })` 一致。

### 与左侧关系

- 两条**并行开工**路径，非从属。
- 防止双开：沿用 `beginAgentTurn` / `appState` 守卫 + dock/Fab 在 `thinking` 时 disabled。

### 聆听反馈

- 保留全局 `ListeningHud`；Fab 在 listening 时高亮/缩放。

---

## 6. App 层接线变更摘要

| 文件                              | 变更                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `App.tsx`                         | 移除 `AnalysisBottomBar`；Dock props 传入 `DiscoveryWorkspace`；Fab 留在 `AnalysisStagePanel` 或同级 |
| `discovery-workspace.tsx`         | 布局改为 `flex flex-col`：ScrollArea `flex-1` + Dock `shrink-0`                                      |
| `analysis-stage-panel.tsx`        | 删除 `children` 槽位；底部渲染 `StageVoiceFab`                                                       |
| `starter-wizard.tsx`              | 移除底部按钮区；导出 intake/step 由父级控制                                                          |
| `use-analysis-page-controller.ts` | 新增 `handleVoiceStartAnalysis(text)`（Step1）与现有语音路径复用                                     |

---

## 7. 移动端

- 默认断点：`lg` 以上双栏；以下单列。
- 顺序：**DiscoveryWorkspace（含 Dock）在上 → Stage 3D + Fab 在下**。
- 窄屏可保留舞台「展开/收起」\_toggle。

---

## 8. 非目标（YAGNI）

- 不隐藏哆啦 3D。
- 不在右侧恢复文字输入条。
- 不在本 spec 做 SEO / outcome 扩充。
- Step 3 底栏追问输入为 **Phase 2 可选**。

---

## 9. 验收标准

1. 右侧无 `AnalysisBottomBar` 长条，仅有 3D + 圆形语音 Fab。
2. 左侧每步底部均有 `AnalysisInteractionDock`，Step 1 可见步进与「开始分析」。
3. Step 1 语音（B）可直接启动分析；左侧「开始分析」仍可用。
4. Step 2 澄清 chips、文字、摘要、挖口袋均在左侧 Dock。
5. `currentPrompt` 展示仍为任务短句（`displayPrompt`），非整段【冷启动】。
6. `npm run typecheck` 与相关单测通过。

---

## 10. 实现方案选择

**采用方案 1：** 状态提升 + `AnalysisInteractionDock` + `StageVoiceFab`，不保留右侧半套 BottomBar。

**预估：** 约 1.5–2.5 人日；主要工作量在 props 搬家与 Dock 显隐矩阵测试。

---

## 11. 后续步骤

1. 用户过目本 spec（当前步骤）
2. `writing-plans` → `docs/superpowers/plans/2026-06-03-analyse-layout-dock.md`
3. 用户 `ENTER EXECUTE MODE` 后按 PLAN 实施

---

## 12. 实现状态（2026-06-03）

**状态：已实现**

- 计划：[docs/superpowers/plans/2026-06-03-analyse-layout-dock.md](../plans/2026-06-03-analyse-layout-dock.md)
- 左侧：`AnalysisInteractionDock`（Step1 步进 / Step2 会话 / Step3 新任务）
- 右侧：`StageVoiceFab` + 3D 舞台；已移除 `AnalysisBottomBar`
- 语音冷启动：`composeStarterPromptFromVoice` + 规则 B（`use-analysis-page-controller`）
- 向导：`StarterWizardContent` + `useStarterWizardState` 状态提升
