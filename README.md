# DoraPocket-Next

DoraPocket 是一个哆啦A梦式工具服务 Agent。

它不是聊天助手，也不是普通工具导航站。它要做的事情是：当用户说出当前任务时，先理解处境，再从一套持续成长的工具知识库里，挑出这次最值得先用的工具，并推动用户进入下一步。

## 产品定位

DoraPocket 的前台价值是 `Agent`，不是工具目录。

当前产品结构只保留三层：

- `/analyse`：主舞台。用户描述任务，DoraPocket 负责理解场景、收敛候选、给出结论与下一步动作。
- `/market`：`道具库`。用户发现工具、提交工具、补充体验，帮助 DoraPocket 的工具知识库继续生长。
- `/pocket`：`我的口袋`。承接账户信息、设置、我的工具，是唯一的“我的”页面。

## 当前进度

目前项目已经完成的核心部分：

- 主 Agent 链路已经成立：任务输入、候选工具裁决、解释与流式返回都已接通。
- 道具库已经具备雏形：工具条目、分类、标签、提交、反馈、口袋保存与使用记录都已打通。
- 个人侧入口已经收口到“我的口袋”：账户信息、设置、我的工具回到一个页面。

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

至少需要配置：

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_STORAGE_BUCKET_AVATARS`
- `NEXT_PUBLIC_SITE_URL`
- `QWEN_API_KEY`

语音与道具库资源相关能力还依赖以下变量：

- `ALIYUN_AK_ID`
- `ALIYUN_AK_SECRET`
- `ALIYUN_NLS_APPKEY`
- `ALIYUN_TTS_VOICE`
- `ALIYUN_NLS_STT_WS_URL`
- `ALIYUN_OSS_REGION`
- `ALIYUN_OSS_BUCKET`
- `ALIYUN_OSS_ACCESS_KEY_ID`
- `ALIYUN_OSS_ACCESS_KEY_SECRET`
- `ALIYUN_OSS_ENDPOINT`
- `ALIYUN_OSS_PUBLIC_BASE_URL`
- `ALIYUN_OSS_FAVICON_PREFIX`

`.env.example` 提供了占位模板。

## 部署前配置

除了部署平台环境变量，Supabase 控制台还需要完成这些配置：

- 在 `Auth` 中配置站点 URL 与允许的回调地址，确保包含生产域名和 `/api/auth/callback`
- 创建 `avatars` bucket，或保证 `SUPABASE_STORAGE_BUCKET_AVATARS` 与实际 bucket 名一致
- 当前头像展示依赖公开 URL，因此头像 bucket 需要可公开读取
- `SUPABASE_SECRET_KEY` 必须是真正的 `sb_secret_...`，不能填 publishable key
- 生产数据库需要执行 migration
- 首次部署后按需执行 `npm run seed:tools`

## 当前边界

当前阶段的重点不是继续堆页面，而是先把主 Agent 产品体验做实。

换句话说：

- 主舞台优先于后台管理
- 道具库优先于“市场感”
- 我的口袋优先于抽象资产概念
- 知识库成长优先于预设技术口号
