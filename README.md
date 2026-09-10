# DoraPocket

> 说出你想完成的事，找到此刻值得先试的工具。

DoraPocket 是一个从任务出发的 AI 工具推荐助手。用户描述目标、预算、角色和使用限制后，DoraPocket 会理解任务、收束候选、解释推荐理由，并帮助用户开始下一步行动。

[在线体验](https://dorapocket.nirvazure.cn/) · [提交问题或建议](https://github.com/dorapocket/dorapocket/issues)

## 项目简介

DoraPocket 解决的不是“有哪些工具”，而是“针对我现在的任务，应该先试哪个工具”。核心流程是：描述任务 → 补充条件 → 推荐候选 → 打开或收藏 → 反馈。

当前产品主要帮助用户选择并跳转到外部工具；具体任务仍由用户在对应工具中完成。

## 当前能力

- **任务推荐 `/analyse`**：通过文字或语音描述任务，必要时补充条件，获得首选工具、备选工具和推荐理由。
- **道具库 `/market`**：浏览、搜索、分类查看工具，提交新工具并查看评价与信任信号。
- **我的口袋**：收藏值得再次使用的工具，记录来源问题和使用情况。
- **推荐历史**：登录后查看推荐会话、推荐结果和评价记录。
- **个人设置 `/profile`**：管理个人资料、偏好和语音、解释模式等设置。
- **语音交互**：支持语音输入和回答播报，需要部署方配置阿里云语音服务。
- **外部候选建议**：工具库覆盖不足时补充模型生成的外部候选，并标识其来源。
- **任意门**：从工具库随机打开一个值得探索的推荐。

收藏、提交、评价、推荐历史和个人记录需要登录；推荐与工具市场支持先匿名体验。

## 当前边界

- DoraPocket 负责工具选择和启动建议，不代替用户完成外部工具中的任务。
- 外部候选来自模型，可能尚未经过实时 URL、价格或可用性核验。
- 推荐质量依赖工具库、任务信息和用户反馈；当前仍处于早期迭代阶段。
- 生产环境需要正确配置数据库、Supabase、模型服务和可选语音服务。

## 技术栈

- **应用**：Next.js 16 App Router、React 19、TypeScript
- **界面**：Tailwind CSS、shadcn/ui、Lucide React
- **3D 与语音**：React Three Fiber、Three.js、阿里云语音识别与语音合成
- **Agent**：LangChain、LangGraph、Qwen
- **数据**：Prisma 7、PostgreSQL、pgvector、全文搜索
- **平台服务**：Supabase Auth、Storage、Realtime；Vercel Cron
- **客户端状态**：Zustand、TanStack Query
- **工程工具**：Yarn 1.22.22、ESLint、Prettier、TypeScript、tsx

## 项目结构

```text
src/
├─ app/                         页面和 API 路由
│  ├─ analyse/                  分析、澄清、推荐和 3D 舞台
│  ├─ market/                   工具市场与我的口袋
│  ├─ profile/                  个人资料与设置
│  └─ api/                      认证、推荐、市场、用户和后台接口
├─ components/                 跨页面组件、Provider 和 UI 原语
├─ lib/                        客户端查询、Supabase、音频、语音、实时同步
├─ server/                     Agent、认证、仓储、检索、存储、Webhook、Cron
├─ shared/                     跨端类型、领域规则、市场和发现逻辑
└─ store/                      客户端应用状态
prisma/                        数据库 schema 与迁移
public/                        3D 模型、图片、音频和浏览器 worklet
```

目录职责以当前代码为准：页面编排留在 `src/app`，服务端数据访问集中在 `src/server`，跨端契约和纯规则放在 `src/shared`，通用客户端能力放在 `src/lib`。

## 核心数据流

### 推荐链路

`/analyse` 收集任务与限制 → `/api/chat` → Agent 理解与澄清 → 工具召回与排序 → 生成推荐解释 → 用户打开、收藏或评价。

推荐会结合工具目录、向量召回、全文搜索、用户口袋、历史反馈、工具活动和推荐评价。登录用户的推荐结果会持久化为推荐会话。

### 市场与用户数据

`/market` 从数据库读取工具目录，支持搜索、分类、提交、评价和删除用户拥有的工具。用户口袋、个人设置、市场反馈、推荐历史和活动记录通过 `/api/me/*` 接口访问。

### 后台维护

工具提交和数据库变化通过 Supabase Database Webhook 触发处理；Vercel Cron 定期作为兜底，负责待处理投稿去重、工具 favicon 与 embedding 同步、评价聚合和过期推荐会话清理。

工具 embedding 使用 PostgreSQL 的 `vector` 扩展，全文搜索使用 `pg_trgm` 等数据库能力。工具图标和用户头像使用 Supabase Storage，默认 bucket 为 `market-assets` 与 `avatars`。

## 本地运行

环境要求：Node.js、Yarn 1.22.22、PostgreSQL/Supabase，以及 Qwen API。复制 `.env.example` 为 `.env` 并填写本地配置。

```bash
yarn install
yarn prisma:generate
yarn prisma:migrate
yarn dev
```

Windows PowerShell 可执行 `Copy-Item .env.example .env`。最小必需环境变量包括 `DATABASE_URL`、`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`、`QWEN_API_KEY` 和 `CRON_SECRET`。

语音能力还需要 `ALIYUN_AK_ID`、`ALIYUN_AK_SECRET` 和 `ALIYUN_NLS_APPKEY`。GitHub/Google OAuth 在 Supabase Dashboard 中配置，不需要在 Next.js 中单独配置 provider。

空数据库不会自动附带工具目录；完整迁移链需要目标数据库支持并允许创建 `vector` 与 `pg_trgm` 扩展。生产启动使用 `yarn start`，常用检查命令是 `yarn typecheck`、`yarn lint` 和 `yarn build`。

部署 Cron 的入口是 `/api/cron/process-jobs`，Webhook 和 Cron 请求需要共享 `CRON_SECRET`。

## 未来方向

未来工作围绕四个方向展开：

1. **提升推荐可靠性**：建立真实、可解释的反馈语义和推荐质量评估。
2. **降低第一次使用门槛**：让用户无需构思长 prompt，也能快速得到有用的第一次推荐。
3. **沉淀可复用经验**：记录“什么人在什么限制下尝试什么工具后有效”，逐步形成任务经验资产。
4. **完善工具质量治理**：加强投稿审核、外部候选核验、目录质量管理、可观测性和数据规模边界。

具体的未完成事项与优先级见 [`Todo.md`](Todo.md)。

## 参与共建

发现好工具，可以在道具库中提交；推荐不合适，可以留下反馈；遇到问题或有新想法，欢迎[创建 Issue](https://github.com/dorapocket/dorapocket/issues)。项目使用 MIT License。
