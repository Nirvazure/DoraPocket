# DoraPocket 待办

## Supabase 能力增强

> 背景：当前 Supabase 主要用于 Postgres 托管、Auth（OAuth）、头像 Storage；业务数据经 Prisma + Next.js API 访问。以下按优先级排列。

### 高优先级（与产品核心直接相关）

- [x] **pgvector 语义检索 — Phase 1（已完成）**
  - 设计：`docs/superpowers/specs/2026-05-26-pgvector-tool-recall-design.md`
  - 计划：`docs/superpowers/plans/2026-05-26-pgvector-tool-recall.md`
  - ~~Phase 2：RecommendationSession 历史相似~~（延后）
  - ~~Phase 3：MarketSubmission 去重~~（延后）

- [x] **Postgres 全文检索（FTS）— 市场页搜索（已完成）**
  - 设计：`docs/superpowers/specs/2026-05-26-market-fts-search-design.md`
  - 计划：`docs/superpowers/plans/2026-05-26-market-fts-search.md`
  - tsvector + pg_trgm + `/api/market/tools?q=` + 前端 debounce

- [x] **Storage 扩展：道具库静态资源 — Phase A（已完成）**
  - 工具 favicon 迁移至 Supabase Storage `market-assets`，弃用阿里云 OSS
  - `iconImageUrl` 为唯一来源；`syncToolFavicon` 于用户提交时自动抓 icon
  - 一次性迁移：`yarn migrate:favicons`
  - ~~用户提交截图/附件~~（Phase B 延后）
  - ~~TTS 音频缓存~~（延后）

### 中等优先级（体验与架构增强）

- [x] **Realtime 多端同步（已完成）**
  - PocketItem / UserSettings / ChatHistoryEntry / MarketSubmission Realtime 订阅
  - 登录后 RealtimeSyncProvider 推送 → TanStack Query 刷新
  - localStorage bridge 已移除（保留 migrate-local 一次性迁移）

- [ ] **Database Webhooks + Edge Functions（异步任务）**
  - `Tool` 新增/更新 → 生成 embedding、抓取 favicon
  - `MarketSubmission` 提交 → 去重检测、自动打标签
  - 定时 Cron → 刷新工具评分聚合、清理过期 session
  - 评估：Database Webhook → Edge Function 比 API 内 `await` 更解耦；也可先用 Vercel Cron

- [ ] **Auth 增强**
  - Auth Hook：用户创建时自动写 `User` 表，替代/简化 callback 里的 `upsertUserFromSupabaseUser`
  - MFA：若未来有付费或敏感数据
  - 更多 Provider（微信/Apple 等）：需评估与现有直连 OAuth 架构的兼容性

### 较低优先级（视架构选择而定）

- [ ] **Row Level Security (RLS)**
  - 仅在前端计划直接用 Supabase Client 读表时有明显价值
  - 当前所有数据访问经 Prisma + `verifySession()`，RLS 非刚需

- [ ] **Supabase Queues / pg_cron**
  - 批量 embedding 回填、市场数据统计、定期 `seed:tools` 同步
  - 工具量不大时可先用 Next.js / Vercel Cron 代替

- [ ] **Supabase Branching**
  - 多人协作、隔离 migration 实验
  - 偏 DevOps，非产品功能

### 架构约束（实施时注意）

- Prisma 查库路径可继续沿用；pgvector/FTS 在 Prisma migration 中扩展即可
- 自定义 OAuth 与 Supabase Dashboard OAuth 是两套路径，新增 Auth 能力时需明确走哪条链路
- 头像 bucket 当前为公开读 + Admin 上传；Storage 扩展需按资源类型设计访问策略

### 建议实施顺序

1. pgvector — 强化 Agent 核心（工具决策知识库）
2. FTS — 强化 `/market` 发现体验
3. Storage 扩展 — 统一 OSS + 用户提交资产
4. Realtime — 消除 localStorage 双轨，提升多端一致性
5. Webhooks / Cron — 工具池规模化后的运维自动化
