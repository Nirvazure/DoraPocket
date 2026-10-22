# DoraPocket

> 说出你想完成的事，找到此刻值得先试的工具。

DoraPocket 是一个从任务出发的 AI 工具推荐助手。用户描述目标、预算、角色和使用限制后，DoraPocket 会理解任务、收束候选、解释推荐理由，并帮助用户开始下一步行动。

[在线体验](https://dorapocket.nirvazure.cn/) · [提交问题或建议](https://github.com/dorapocket/dorapocket/issues)

## 项目简介

DoraPocket 解决的不是“有哪些工具”，而是“针对我现在的任务，应该先试哪个工具”。核心流程是：描述任务 → 补充条件 → 推荐候选 → 打开或收藏 → 反馈。

当前产品主要帮助用户选择并跳转到外部工具；具体任务仍由用户在对应工具中完成。

## 当前能力

- **任务推荐 `/analyse`**：通过文字或语音描述任务，必要时补充条件，获得首选工具、备选工具和推荐理由。
- **道具库 `/market`**：浏览、搜索、分类查看工具，提交新工具并查看真实用户评价。
- **我的口袋**：收藏值得再次使用的工具，记录来源问题和使用情况。
- **推荐历史**：登录后查看推荐会话、推荐结果和评价记录。
- **个人设置 `/profile`**：管理个人资料、偏好和语音、解释模式等设置。
- **语音交互**：支持语音输入和回答播报，需要部署方配置阿里云语音服务。
- **推荐范围切换**：推荐页可临时选择“仅找库中”或“混合模式”；前者只使用工具目录中的工具，后者会把库内候选与模型生成的库外候选一起排序。
- **推荐数量与匹配度**：可选择最多 3、5 或 10 个推荐（包含主推荐），最低匹配度分别自动设为 90%、80% 或 70%，默认 5 个、80%。匹配度是模型依据工具资料对任务适配度的独立评估，不是成功概率；核心任务和明确必需条件不满足的工具不会推荐，符合门槛的候选不足时不会补入低分工具，没有合格候选时明确返回空结果。
- **外部候选建议**：混合模式允许补充模型生成的外部候选，并标识其来源；外部候选的 URL、价格和可用性仍需用户自行核验。
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
- **平台服务**：Supabase Auth、Storage；Vercel Cron
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
├─ lib/                        客户端 API 查询、服务端 Supabase、音频、语音
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

工具提交和数据库变化通过 Supabase Database Webhook 触发处理；Vercel Cron 定期作为兜底，负责待处理投稿去重、缺失工具 favicon 与 embedding 同步、过期推荐会话清理。

业务表位于共享 YQYHub 项目的 `dorapocket` schema，账号使用该项目的 Supabase Auth。Tool 只保留 14 个业务字段，工具归属由 `createdByUserId` 表示，状态为 `active` / `inactive`，不再区分平台收录和用户提交。价格、平台允许 `unknown`，是否需要登录允许未知；工具订阅和执行参数功能已移除，外部工具的订阅价格仍可记录。

`ToolIndex` 独立保存规范化检索文本、内容哈希、全文搜索列和 1024 维向量。embedding 默认使用 Qwen `text-embedding-v3`；工具内容变更会原子清空旧向量，后台按内容哈希与模型重新生成，防止旧任务覆盖新内容。评分从 MarketFeedback 计算，不再写回工具 JSON。工具图标和用户头像使用 Supabase Storage，bucket 为 `dorapocket-market-assets` 与 `dorapocket-avatars`。已有第三方或仓库图标保持原地址，只有缺失图标才补 favicon。

## 本地运行

环境要求：Node.js、Yarn 1.22.22、PostgreSQL/Supabase，以及 Qwen API。复制 `.env.example` 为 `.env` 并填写本地配置。本地仅保留 `.env`（真实配置，不提交）和 `.env.example`（无密钥模板）；开发和生产构建均读取 `.env`。

```bash
yarn install
yarn prisma:generate
yarn prisma:migrate
yarn dev
```

Windows PowerShell 可执行 `Copy-Item .env.example .env`。最小必需环境变量包括 `DATABASE_URL`、`SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`、`QWEN_API_KEY` 和 `CRON_SECRET`。

数据库连接池上限固定为 5；向量模型固定为 `text-embedding-v3`，维度为 1024，向量召回始终启用，服务不可用时降级为关键词检索。这些行为无需环境变量配置。

语音能力还需要 `ALIYUN_AK_ID`、`ALIYUN_AK_SECRET` 和 `ALIYUN_NLS_APPKEY`。GitHub/Google OAuth 在 Supabase Dashboard 中配置，不需要在 Next.js 中单独配置 provider。

`DATABASE_URL` 使用专用 `dorapocket_app` 运行角色；执行数据库迁移时，通过进程环境变量单独传入 DDL 连接 `MIGRATION_DATABASE_URL`（日常构建和 `.env` 模板不需要），URL 的 schema 必须为 `dorapocket`。`yarn prisma:migrate` 执行 `migrate deploy`，只应用 `prisma/migrations-dorapocket` 中的新基线；旧 `prisma/migrations` 保留用于源项目追溯。不要对共享项目运行 `migrate dev`、`db push` 或 reset。空数据库不会自动附带工具目录，基线需要 DDL 账号有权限创建 `vector`、`pg_trgm`、schema 和角色。生产启动使用 `yarn start`，常用检查命令是 `yarn typecheck`、`yarn lint` 和 `yarn build`。

使用 `sslmode=verify-full` 的连接应同时提供 `sslrootcert`。仓库内的 `prisma/supabase-ca.crt` 是 Supabase 的公开 CA 证书，Next.js 会将其纳入服务端部署文件；它不含私钥。迁移工具生成的运行连接使用这一相对路径。

部署 Cron 的入口是 `/api/cron/process-jobs`，Webhook 和 Cron 请求需要共享 `CRON_SECRET`。

## 独立项目迁入 YQYHub

迁移已完成，旧 DoraPocket Supabase 项目已删除。以下脚本和流程保留用于追溯，不再作为当前部署步骤；依赖旧项目的检查和导出命令已无法运行。应用现已移除迁移期间的维护拦截逻辑。

迁移工具固定校验源项目 `eatsznumylwggpvlwkfk`、目标项目 `tfvzcuksahcofooqqezx` 和 `dorapocket` schema。历史工具不读取任何环境文件；若确需使用，必须通过进程环境变量显式提供 `SOURCE_SUPABASE_URL`、`SOURCE_DATABASE_URL`、`SOURCE_SUPABASE_SECRET_KEY` 及对应的 `TARGET_*` 配置。当前 `.env` 只保存 YQYHub 的运行配置。不要提交连接串、secret key 或快照。

工具默认只读，写入步骤必须显式追加 `--apply`。按以下顺序执行，所有本地快照保存在忽略的 `tmp`：

```bash
yarn migration:dorapocket inspect
yarn migration:dorapocket schema --apply
yarn migration:dorapocket provision-runtime --apply
yarn migration:dorapocket export --apply --artifact tmp/dorapocket-migration.json
yarn migration:dorapocket copy-assets --apply --artifact tmp/dorapocket-migration.json
yarn migration:dorapocket import --apply --artifact tmp/dorapocket-migration.json
yarn migration:dorapocket restore-vectors --apply --artifact tmp/dorapocket-migration.json
yarn migration:dorapocket verify --artifact tmp/dorapocket-migration.json
```

只迁移有效 HTTP/HTTPS 工具和它们引用的源 Storage 图片，排除教程、文档和参考资源。源工具全字段和旧向量另存不可覆盖的快照；正文将旧能力、适用说明和风险说明去重合并。目标 GitHub Auth 用户经核验后映射为业务 User，全部迁入工具归其所有。旧用户、头像、收藏、历史、评价、活动和投稿记录不导入；旧浏览器自动导入停用，原导入接口对登录用户返回 410，浏览器本地数据不会被清除。图片通过 Storage API 复制并核对哈希，不修改 Storage 系统表。

`restore-vectors` 直接复制快照中有效的旧向量，不调用 Qwen；它校验原始输入哈希、模型、1024 维数值和对应工具快照，拒绝覆盖不同的目标向量。旧向量仍表达原文本模板，作为本次导入内容的检索基线，不能视为已重新编码精简后的文本；原始输入哈希、生成时间、向量哈希和接受的目标内容哈希保存在旁路 `.vector-reuse.json` 报告中。后续工具内容变更仍会清空旧向量并按新模板生成。如果旧向量缺失或失效，或者确实需要按新模板重新编码，再显式执行 `rebuild-index --apply`；该步骤会调用 Qwen。

当前部署使用 `dorapocket_app` 运行连接和 YQYHub 的 Supabase URL/key；生产运行环境不要包含迁移账号、`TARGET_*` 或 `MIGRATION_DATABASE_URL`。`SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY` 可关联 Vercel Shared 变量，由服务端直接读取，无需浏览器映射。GitHub 登录由 `/api/auth/github` 发起，OAuth 要允许本站 `/api/auth/callback` 回调；会话 Cookie 使用 HttpOnly，由服务端刷新。Database Webhook 指向 `dorapocket.Tool` / `dorapocket.MarketSubmission`。浏览器通过本站 API 获取数据，不创建 Supabase Client，也不订阅 Realtime。数据在页面正常加载时获取，本页操作后更新；不轮询，也不在恢复焦点或网络时自动刷新，不提供跨标签页、跨设备自动同步。查询缓存按用户隔离。无需将该 schema 加入 Data API exposed schemas。部署后核验登录、提交、搜索、收藏、评价、图片和后台任务。

旧项目已不可用于回退。后续故障应先备份 YQYHub 中的新数据，再向前修复；保留本地迁移快照和向量来源报告，不要覆盖其他应用 schema。迁移脚本遇到已有不同工具或图片会停止；重复导入相同内容会跳过。

## 未来方向

未来工作围绕四个方向展开：

1. **提升推荐可靠性**：建立真实、可解释的反馈语义和推荐质量评估。
2. **降低第一次使用门槛**：让用户无需构思长 prompt，也能快速得到有用的第一次推荐。
3. **沉淀可复用经验**：记录“什么人在什么限制下尝试什么工具后有效”，逐步形成任务经验资产。
4. **完善工具质量治理**：加强投稿审核、外部候选核验、目录质量管理、可观测性和数据规模边界。

具体的未完成事项与优先级见 [`Todo.md`](Todo.md)。

## 参与共建

发现好工具，可以在道具库中提交；推荐不合适，可以留下反馈；遇到问题或有新想法，欢迎[创建 Issue](https://github.com/dorapocket/dorapocket/issues)。项目使用 MIT License。
