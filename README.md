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
- `SUPABASE_STORAGE_BUCKET_AVATARS`
- `QWEN_API_KEY`

Optional (defaults available)：

- `SUPABASE_STORAGE_BUCKET_MARKET`（默认 `market-assets`，客户端拼公开图标 URL 时亦使用该默认值）

- `NEXT_PUBLIC_SITE_URL`（默认 `http://localhost:3000`）
- `QWEN_MODEL`（默认 `qwen-plus`）
- `QWEN_BASE_URL`（默认 `https://dashscope.aliyuncs.com/compatible-mode/v1`）

Optional voice features：

- `ALIYUN_AK_ID`
- `ALIYUN_AK_SECRET`
- `ALIYUN_NLS_APPKEY`
- `ALIYUN_TTS_VOICE`（默认 `zhitian_emo`，TTS 服务端使用）
- `ALIYUN_NLS_STT_WS_URL`（默认 `wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1`）

`.env.example` 提供了占位模板。

本地开发只需配置 Core required 即可跑通主链路；语音功能可按需补齐 Optional voice features。

Aliyun 命名规范统一为 `ALIYUN_AK_ID` / `ALIYUN_AK_SECRET`，若旧环境仍使用 `ALIYUN_ACCESS_KEY_ID` / `ALIYUN_ACCESS_KEY_SECRET`，请迁移后再部署。

## 部署前配置

除了部署平台环境变量，Supabase 控制台还需要完成这些配置：

- 在 `Auth` 中配置站点 URL 与允许的回调地址，确保包含生产域名和 `/api/auth/callback`
- 创建 `avatars` bucket，或保证 `SUPABASE_STORAGE_BUCKET_AVATARS` 与实际 bucket 名一致
- 当前头像展示依赖公开 URL，因此头像 bucket 需要可公开读取
- `SUPABASE_SECRET_KEY` 必须是真正的 `sb_secret_...`，不能填 publishable key
- 生产数据库需要执行 migration
- 首次部署后按需执行 `npm run seed:tools`
