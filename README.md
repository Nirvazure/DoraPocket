# DoraPocket-Next

DoraPocket 是一个哆啦A梦式工具服务 Agent。

它不是聊天助手，也不是普通工具导航站。它要做的事情是：当用户说出当前任务时，先理解处境，再从一套持续成长的工具知识库里，挑出这次最值得先用的工具，并推动用户进入下一步。

## 产品定位

DoraPocket 的前台价值是 `Agent`，不是工具目录。

当前产品结构只保留三层：

- `/analyse`：主舞台。用户描述任务，DoraPocket 负责理解场景、收敛候选、给出结论与下一步动作。
- `/market`：`道具库`。发现工具、提交工具、补充体验；侧栏「我的口袋」管理收藏。
- `/profile`：`我的`。账户信息与 DoraPocket 偏好设置。
- `/pocket`：兼容旧链接，重定向至 `/profile`。

## 当前进度

目前项目已经完成的核心部分：

- 主 Agent 链路已经成立：任务输入、候选工具裁决、解释与流式返回都已接通。
- 道具库已经具备雏形：工具条目、分类、标签、提交、反馈、口袋保存与使用记录都已打通。
- 个人侧入口已拆分：`/profile` 负责账户与设置，收藏工具在道具库侧栏「我的口袋」管理。

目前还在持续演进的部分：

- 工具知识库还在从“带反馈的工具池”成长为真正的任务决策知识库。
- 哆啦A梦式“掏工具”交互感还在继续打磨。
- 道具库和我的口袋会继续围绕主 Agent 体验做减法，而不是各自长成独立平台。

## 技术栈

- 框架：`Next.js 16.2.4`
- UI：`React 19.2.4`
- 语言：`TypeScript`
- 样式：`Tailwind CSS`
- Agent：`LangChain` / `LangGraph`
- 数据层：`Prisma 7` + `PostgreSQL`
- 认证与云能力：`Supabase`
- 状态管理：`Zustand`

## 本地启动

```bash
npm install
cp .env.example .env.local
npm run prisma:generate
npm run prisma:migrate
npm run seed:tools
npm run dev
```

## 环境变量

Core required (local minimum)：

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `QWEN_API_KEY`

Optional voice features：

- `ALIYUN_AK_ID`
- `ALIYUN_AK_SECRET`
- `ALIYUN_NLS_APPKEY`

应用常量（Qwen 模型、Storage bucket、Cron batch size、站点 URL 等）见 `src/constant.ts`，无需写入环境变量。

生产 / 后台任务：

- `CRON_SECRET`（Vercel Cron 与 Supabase Database Webhook 共用 Bearer 密钥）

`.env.example` 提供了占位模板。

本地开发只需配置 Core required 即可跑通主链路；语音功能可按需补齐 Optional voice features。

Aliyun 命名规范统一为 `ALIYUN_AK_ID` / `ALIYUN_AK_SECRET`，若旧环境仍使用 `ALIYUN_ACCESS_KEY_ID` / `ALIYUN_ACCESS_KEY_SECRET`，请迁移后再部署。

## 部署前配置

除了部署平台环境变量，Supabase 控制台还需要完成这些配置：

- 在 `Auth` 中配置站点 URL 与允许的回调地址，确保包含生产域名和 `/api/auth/callback`
- 创建 `avatars` bucket（名称见 `src/constant.ts` 中的 `SUPABASE_STORAGE_BUCKET_AVATARS`）
- 当前头像展示依赖公开 URL，因此头像 bucket 需要可公开读取
- `SUPABASE_SECRET_KEY` 必须是真正的 `sb_secret_...`，不能填 publishable key
- 生产数据库需要执行 migration
- 首次部署后按需执行 `npm run seed:tools`
- 配置 `CRON_SECRET`（Vercel Cron 与 Supabase Database Webhook 共用；Supabase Webhook Header 填 `Authorization: Bearer <CRON_SECRET>`）
- Cron 默认每天 03:00 UTC 批量同步 Tool embedding/favicon、MarketSubmission 去重、工具评分聚合、清理过期 RecommendationSession（Hobby 计划 Cron 最多每天一次；Pro 可改为更短间隔如 `*/5 * * * *`）
- 本地测试 Cron：`curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/process-jobs`
- 配置 Supabase Database Webhook（实时触发，Cron 作兜底）：
  - 在 Supabase Dashboard → Database → Webhooks 创建 HTTP Webhook
  - URL：`https://<your-domain>/api/webhooks/supabase`
  - Header：`Authorization: Bearer <CRON_SECRET>`
  - 表 `Tool`：事件 INSERT、UPDATE
  - 表 `MarketSubmission`：事件 INSERT
- 本地测试 Webhook：`curl -X POST -H "Authorization: Bearer $CRON_SECRET" -H "Content-Type: application/json" -d "{\"type\":\"INSERT\",\"table\":\"Tool\",\"schema\":\"public\",\"record\":{\"id\":\"<toolId>\",\"status\":\"active\",\"url\":\"https://example.com\",\"iconImageUrl\":null,\"embeddedAt\":null},\"old_record\":null}" http://localhost:3000/api/webhooks/supabase`
