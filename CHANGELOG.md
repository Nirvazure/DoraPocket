# 更新日志

本文档用于记录项目各版本的重要变更。
格式参考 Keep a Changelog，并以语义化版本作为实际发布记录方式。

## [0.0.4] - 2026-04-27

### 新增

- 新增 `Supabase Auth` 登录流，包括 Magic Link 登录页、回调路由、退出登录路由与会话接口
- 新增 `Prisma 7 + PostgreSQL` 数据层接入，包括 `prisma/schema.prisma`、迁移脚本、`prisma.config.ts` 与服务端 Prisma 适配器
- 新增云端 API 路由，覆盖用户资料、设置、口袋、反馈、订阅、活动、偏好与聊天历史
- 新增 `Supabase Storage` 头像上传接口与前端接入链路
- 新增本地数据迁移入口与工具种子初始化脚本

### 变更

- 移除原有第三方认证体系，统一切换到 `Supabase Auth`
- 将用户资料、口袋、市场反馈、推荐会话等持久化能力统一切到 `Supabase Postgres`
- 将头像能力统一切到 `Supabase Storage`
- 升级 Supabase 环境变量命名体系：
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
- 将当前上线目标明确为海外展示环境，国产化适配转入后续优化方向
- 更新 `README.md`、环境变量模板与部署说明，使其与当前架构保持一致

### 修复

- 修复客户端通过动态方式读取 `NEXT_PUBLIC_*` 环境变量导致的运行时错误
- 修复 Supabase 密钥配置错误导致的头像上传 RLS 问题
- 修复头像上传后无法正常展示的问题，明确依赖公开可读的头像 bucket

## [0.0.3] - 2026-04-25

### 新增

- 新增 TanStack Query 基础设施与 Provider
- 新增 Query 数据层封装：
  - `src/lib/query/market.ts`
  - `src/lib/query/pocket.ts`
  - `src/lib/query/chat-history.ts`
  - `src/lib/query/user-profile.ts`
- 新增通用本地存储封装 `src/lib/storage.ts`
- 新增分析页拆分组件：
  - `src/components/analysis-input-composer.tsx`
  - `src/components/analysis-stage-panel.tsx`
- 新增一组用于承接分析页与工具动作的 hooks
- 新增 Agent 服务端拆分模块

### 变更

- 将用户资料、口袋库存、市场反馈、聊天历史等客户端状态逐步收口到 TanStack Query
- 重构分析页、个人中心、市场页与服务端 Agent 相关结构
- 统一本地存储实现并收紧市场偏好类型约束

### 移除

- 移除一批不再使用的旧组件与废弃代码

### 修复

- 修复分析页文案、状态残留与多处重复工具动作实现问题

## [0.0.2] - 2026-04-24

### 新增

- 新增市场 favicon 上传到阿里云 OSS 的环境变量模板与脚本
- 新增 App Router 页面入口：`/market`、`/pocket`、`/profile`
- 新增独立个人中心、用户资料本地持久化、聊天历史本地持久化与 `CHANGELOG.md`

### 变更

- 将产品未来规划文档统一收敛为 `GUIDE.md`
- 重组分析页、市场页、口袋页与个人中心结构
- 更新 `README.md`、`GUIDE.md` 与 `TODO.md`

### 移除

- 移除旧规划文档、废弃图标与不再使用的公共资源和旧组件

### 修复

- 修复若干 lint warning、品牌资源不一致和页面布局问题
