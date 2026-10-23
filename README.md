# DoraPocket

> 说出要完成的事，找到值得先试的工具。

DoraPocket 是任务驱动的 AI 工具推荐助手。用户描述目标与限制，必要时补充条件，即可获得首选工具、备选工具和推荐理由；之后可以打开、收藏或评价。具体任务仍在外部工具中完成。

[在线体验](https://dorapocket.nirvazure.cn/) · [反馈问题](https://github.com/dorapocket/dorapocket/issues)

## 当前功能

- **任务推荐 `/analyse`**：支持文字和语音输入、追问澄清与推荐解释。可选“仅找库中”或“混合模式”；混合模式会加入模型生成的库外候选，网址、价格和可用性需自行核验。没有合格候选时不会凑数。
- **工具市场 `/market`**：浏览、搜索、分类查看、随机探索、提交工具和查看评价。投稿直接进入工具库，投稿记录保留在个人活动历史中。
- **我的口袋**：收藏工具、记录使用情况和评价体验。
- **个人页 `/profile`**：目前显示“待实现，敬请期待”，资料与设置界面尚待设计。

推荐和浏览可以匿名体验；收藏、投稿和评价需要 GitHub 登录。语音功能需要阿里云服务配置。

## 技术与结构

应用使用 Next.js 16、React 19、TypeScript、Tailwind CSS、shadcn/ui 和 React Three Fiber；推荐链路使用 LangChain 与 Qwen；数据由 Prisma 7、PostgreSQL、Supabase Auth/Storage 支撑，客户端使用 Zustand 与 TanStack Query。

- `src/app`：页面与 API，包括推荐、市场和个人页占位路由。
- `src/server`：Agent、认证、仓储、检索、存储与 Webhook。
- `src/shared`：跨端类型与领域规则；`src/lib`：客户端查询及通用能力。
- `src/components`、`src/store`：共享组件与客户端状态。
- `prisma`、`public`：数据库 schema/迁移及静态资源。

## 核心链路

1. `/analyse` 收集任务与限制，Agent 结合工具目录、检索结果和用户上下文筛选候选；登录用户的推荐会话与评价会持久化。
2. `/market` 从数据库读取工具目录。用户投稿时工具直接上架，投稿记录仅用于个人活动历史，不作为独立推荐候选。
3. Supabase Database Webhook 在活跃 `Tool` 新增或相关字段更新时同步向量与缺失的 favicon；失败返回 5xx 并记录工具 ID，可按 ID 人工重试。

业务表位于共享 Supabase 项目的 `dorapocket` schema。`ToolIndex` 保存全文检索内容和 Qwen `text-embedding-v3` 的 1024 维向量；工具图片使用 `dorapocket-market-assets` Storage bucket。目前不使用 Vercel Cron，也不自动清理历史推荐会话与评价。

## 本地运行

需要 Node.js、Yarn 1.22.22、PostgreSQL/Supabase 和 Qwen API。复制 `.env.example` 为 `.env`，填写 `DATABASE_URL`、`SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEY`、`SUPABASE_SECRET_KEY`、`QWEN_API_KEY`。`.env` 不应提交。

```bash
yarn install
yarn prisma:generate
yarn dev
```

`DATABASE_URL` 应使用限定在 `dorapocket` schema 的运行账号。仅在需要部署数据库迁移时，通过进程环境变量提供具有 DDL 权限的 `MIGRATION_DATABASE_URL`，再运行 `yarn prisma:migrate`；不要对共享数据库使用 `migrate dev`、`db push` 或 reset。旧迁移脚本 `scripts/migrate-dorapocket.ts` 仅保留用于历史追溯，不是日常启动步骤。

GitHub OAuth 在 Supabase Dashboard 配置，回调地址为 `/api/auth/callback`。可选语音能力需要 `ALIYUN_AK_ID`、`ALIYUN_AK_SECRET` 和 `ALIYUN_NLS_APPKEY`。常用检查命令为 `yarn typecheck`、`yarn lint`、`yarn build`。

## 部署与工具同步

将 Supabase `dorapocket.Tool` Database Webhook 指向 `/api/webhooks/supabase`，Bearer 密钥配置为 `SUPABASE_WEBHOOK_SECRET`。从旧部署升级时，可先将它设为原 `CRON_SECRET` 的值；验证 Tool 同步后，再移除旧的 `MarketSubmission` Webhook 和 `CRON_SECRET`。

同步失败时，在具备数据库、Qwen 和 Supabase 配置的运维环境运行：

```bash
yarn retry:tool-sync --tool-id <工具 ID>
```

命令在配置缺失、工具不存在或同步失败时返回非零退出码；没有自动重试队列。

## 后续方向

继续提升推荐质量、反馈语义和工具目录治理。具体事项与验收条件见 [Todo.md](Todo.md)。项目使用 MIT License。
