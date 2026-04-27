# DoraPocket-Next

做陪伴你的哆啦A梦，我们每个人都可以是大雄。

## 项目定位

DoraPocket 不是聊天壳，也不是纯工具导航站。它的目标是在用户需要帮助时，理解处境，拿出合适工具，并帮助用户完成下一步。

当前线上版本定位为海外展示环境：

- 认证：`Supabase Auth`
- 持久化：`Supabase Postgres`
- 用户头像：`Supabase Storage`

国产化网络与基础设施适配不在当前版本范围内，后续单独推进。

## 技术概览

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

最少需要配置：

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_STORAGE_BUCKET_AVATARS`
- `NEXT_PUBLIC_SITE_URL`
- `QWEN_API_KEY`

语音与市场资源相关能力还依赖以下变量：

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

`.env.example` 已提供占位模板。

## 部署前平台配置

除了部署平台环境变量，Supabase 控制台还需要完成这些配置：

- 在 `Auth` 中配置站点 URL 与允许的回调地址，确保包含生产域名和 `/api/auth/callback`
- 创建 `avatars` bucket，或让 `SUPABASE_STORAGE_BUCKET_AVATARS` 与实际 bucket 名保持一致
- 当前头像展示方案依赖公开 URL，因此头像 bucket 需要可公开读取
- `SUPABASE_SECRET_KEY` 必须是真正的 `sb_secret_...`，不能填写 publishable key
- 生产数据库需要执行 migration
- 首次部署后需要按需执行 `npm run seed:tools`

## 常用命令

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed:tools
npm run typecheck
npm run lint
npm run build
```

## 文档索引

- `GUIDE.md`：产品未来演进策略、阶段路线、开发原则唯一依据
- `README.md`：项目概览、当前状态、本地启动
- `AGENTS.md`：AI 协作边界与工程修改规则
- `TODO.md`：近期优化与下一轮优先事项
