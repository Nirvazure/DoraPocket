# DoraPocket 待办

> 以重度用户视角排列：信任感 → 主链路顺滑 → 差异化与性能。  
> 基础设施（pgvector、FTS、Realtime、Cron/Webhook、Auth Phase 1 等）已完成，不再列入。

---

## P0 — 信任修复（已完成）

- [x] **分析页「收进口袋」未登录假成功**
  - 未登录跳转 `/login?next=...`；成功 toast 仅在 mutation `onSuccess` 后展示

- [x] **统一 `/api/me/*` 认证门控**
  - `pocket`、`market`、`user-profile` 对齐 `useAuthenticatedQueryEnabled` 模式

- [x] **消除静默错误吞没**
  - 移除 me 接口 query 层 `.catch(() => default)`；公开 `/api/market/tools` 同步去掉 catch

- [x] **移除无消费者的 chat-history 运行时**
  - 删除 API / query hooks / Realtime 订阅 / 分析页写入逻辑
  - 保留：Prisma 表、`legacy` 迁移路径（`local-import`）

---

## P1 — 主链路体验（`/analyse` 为核心）

- [ ] **用户会话历史**
  - Step 1 展示最近分析记录（读 `ChatHistoryEntry`）
  - 登录引导与跨设备同步说明
  - 评估与 `RecommendationSession` 合并或分工
  - 前置：DB 表与 legacy 迁移路径已保留；`memoryEnabled` 字段待复用

- [x] **移动端推荐区优先**
  - Step 3 到达时，`< lg` 平滑 scroll 至推荐区（桌面双栏不滚）
  - 推荐揭晓后折叠 3D 舞台至 ~7rem，左上角可「展开/收起舞台」
  - 折叠态卸载 WebGL，展开时重新挂载（省 GPU，展开有短暂重载）

- [x] **3D 舞台加载占位**
  - `AnalysisStageCanvas` dynamic import：`Sparkles` + 缓转圆环 pulse（Lucide，非道具图）
  - 三态占位：`loading`（天蓝 + 旋转 +「舞台加载中…」）/ `idle`（天蓝 Sparkles 静态，折叠）/ `unavailable`（琥珀 + 警告 + 刷新）
  - context lost：`webglcontextlost` → 卸载 Canvas、切 `unavailable` 占位
  - 审阅 2026-06-02：`loading`/`unavailable` 需 `z-[2]` 才能浮于舞台白色渐变层之上；`idle` 保持 `z-0`（折叠态无渐变）
  - 已知局限：无 `webglcontextrestored`；WebGL 初始化失败 / `useGLTF` 抛错仍走 Error Boundary（P2）；移动端「展开舞台」会 remount 并重试 3D；「刷新页面」会丢失当前会话进度

- [x] **澄清流程减负**
  - 「跳过，先看推荐」改为全宽主色按钮，置于快捷回复上方
  - `brief` 解释风格：最多 1 轮澄清（`sessionTurn >= 2` 即 exhausted）；澄清文案更短
  - `showSkip` 与 brief / standard 轮次对齐

- [ ] **登录个性化可感知**
  - 现状：已登录用户的口袋/反馈影响推荐，但 Step 3 无体现
  - 目标：推荐卡片展示「根据你收藏的 XX 类工具调整」等摘要

- [ ] **外部建议一键提交道具库**
  - 现状：打开外部链接后提示手动提交 Tool Hub
  - 目标：预填 URL + 任务上下文，一键打开提交表单

- [ ] **分析页控制器拆分**
  - 现状：`use-analysis-page-controller.ts` 聚合语音/流式/历史/设置/口袋/timer，边缘竞态风险高
  - 目标：按职责拆 hook，关键路径补集成测试（澄清 → 推荐 → 收藏）

### P1 备忘（非阻塞）

- [ ] 未登录 `markToolUsed` 静默 401
- [ ] 访客社区评价公共 API（当前：门控后 `{}`，访客不看评价）

---

## P2 — 差异化与性能

- [ ] **「掏道具」动效链**
  - 目标：推荐揭晓 ↔ 口袋音效 ↔ 收藏反馈连成一条微交互，而非独立 toast

- [ ] **语音功能降级说明**
  - 现状：未配置阿里云 NLS 时语音入口消失或报错，用户不知原因
  - 目标：设置页标注「语音未启用」；自动降级文字输入并说明

- [ ] **Agent 失败重试**
  - 现状：仅 `systemNotice`「这次出手失败了」
  - 目标：提供「重试上次任务」按钮

- [ ] **舞台区局部 Error Boundary**
  - 目标：3D/语音崩溃不拖垮整页
  - context lost 已降级占位；本项仍覆盖：WebGL 初始化失败、`useGLTF` 抛错、R3F 运行时异常

- [ ] **登录后字体闪烁**
  - 现状：`fontPreset` 经 `useLayoutEffect` 同步，登录切换可能闪一下
  - 目标：首屏 inline 默认字体 CSS 或 SSR 友好方案

---

## P3 — 基础设施（视架构需要）

- [ ] **Row Level Security (RLS)**
  - 仅在前端直接用 Supabase Client 读表时有明显价值；当前 Prisma + `verifySession()` 路径下非刚需

- [ ] **Supabase Queues / pg_cron**
  - 批量 embedding、市场统计；工具量不大时可继续用 Vercel Cron

- [ ] **Supabase Branching**
  - 多人协作、隔离 migration 实验；偏 DevOps

### 延后项（记录备查）

- pgvector Phase 2：RecommendationSession 历史相似
- pgvector Phase 3：MarketSubmission 去重（Cron/Webhook 已覆盖基础能力）
- Storage Phase B：用户提交截图/附件
- TTS 音频缓存
- Auth：MFA、微信/Apple 等更多 Provider
- Supabase Edge Function 替代 Next.js Webhook 路由

### 架构约束

- Prisma 查库路径可继续沿用；pgvector/FTS 在 Prisma migration 中扩展即可
- 自定义 OAuth 与 Supabase Dashboard OAuth 是两套路径，新增 Auth 能力时需明确走哪条链路
- 头像 bucket 当前为公开读 + Admin 上传；Storage 扩展需按资源类型设计访问策略
