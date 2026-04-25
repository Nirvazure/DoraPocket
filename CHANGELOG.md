# 更新日志

本文档用于记录项目各版本的重要变更。

格式参考 Keep a Changelog，并以语义化版本作为实际发布记录方式。

## [0.0.3] - 2026-04-25

### 新增

- 新增 TanStack Query 基础设施与 Provider：
  - `src/components/providers/query-provider.tsx`
  - `src/lib/query/query-client.ts`
  - `src/lib/query/query-keys.ts`
- 新增 Query 数据层封装：
  - `src/lib/query/market.ts`
  - `src/lib/query/pocket.ts`
  - `src/lib/query/chat-history.ts`
  - `src/lib/query/user-profile.ts`
- 新增通用本地存储封装 `src/lib/storage.ts`，统一浏览器存储读写入口。
- 新增分析页拆分组件：
  - `src/components/analysis-input-composer.tsx`
  - `src/components/analysis-stage-panel.tsx`
- 新增一组用于收口分析页与工具动作的 hooks：
  - `src/hooks/use-analysis-session.ts`
  - `src/hooks/use-voice-input.ts`
  - `src/hooks/use-discovery-workspace-actions.ts`
  - `src/hooks/use-pocket-gadget-modal-actions.ts`
  - `src/hooks/use-tool-card-actions.ts`
  - `src/hooks/use-auto-save-preference.ts`
  - `src/hooks/use-tool-dial.ts`
- 新增 Agent 服务端拆分模块：
  - `src/server/agent/model.ts`
  - `src/server/agent/ui-payload.ts`
  - `src/server/agent/stream.ts`

### 变更

- 将用户资料、口袋库存、市场反馈、聊天历史等客户端服务端状态逐步收口到 TanStack Query，减少组件直连 service 的分散写法。
- 重构分析页 `src/App.tsx`，将大体量 UI、会话执行、语音输入、Workspace 动作、口袋弹窗动作拆分为独立组件与 hooks，显著降低耦合。
- 调整 `src/components/profile-page.tsx` 与 `src/components/common/profile-entry-pill.tsx`，改为通过 Query 读取与更新用户资料。
- 调整 `src/components/discovery/compact-decision-panel.tsx`，通过回调上报反馈，不再直接写入市场反馈 service。
- 调整 `src/components/market-page.tsx`、`src/components/pocket-page.tsx`，复用统一工具卡动作逻辑，减少重复的“打开工具 / 收入口袋”实现。
- 重构 `src/server/agent/graph.ts`，把模型调用、UI payload 构建、流式切片能力拆分到独立模块，保持行为不变但结构更清晰。
- 统一本地存储实现，更新：
  - `src/services/market-storage.ts`
  - `src/services/pocket-inventory.ts`
  - `src/services/user-profile.ts`
- 优化市场偏好类型约束与推断，收紧 `src/shared/market-types.ts` 中的多个偏好字段类型。
- 将 `src/services/tts.ts` 中的 `fetchTTSAudio` 更名为 `buildTTSAudioUrl`，避免误导性命名。

### 移除

- 移除不再使用的旧组件与死代码：
  - `src/components/agent-insight-panel.tsx`
  - `src/components/pocket-collection-panel.tsx`
  - `src/components/pocket-showcase-panel.tsx`
  - `src/components/tool-dynamic-renderer.tsx`
  - `src/components/discovery/result-feedback-card.tsx`

### 修复

- 修复分析页若干残留乱码、空按钮文案和无效状态残留问题。
- 修复 `App` 中多处重复副作用、拨号盘状态与语音输入流程耦合过深的问题。
- 修复多个页面中重复工具动作实现带来的维护成本与潜在行为不一致风险。

## [0.0.2] - 2026-04-24

### 新增

- 新增市场 favicon 向阿里云 OSS 迁移的环境变量模板：
  - `ALIYUN_OSS_REGION`
  - `ALIYUN_OSS_BUCKET`
  - `ALIYUN_OSS_ACCESS_KEY_ID`
  - `ALIYUN_OSS_ACCESS_KEY_SECRET`
  - `ALIYUN_OSS_ENDPOINT`
  - `ALIYUN_OSS_PUBLIC_BASE_URL`
  - `ALIYUN_OSS_FAVICON_PREFIX`
- 新增市场 favicon 上传脚本 `scripts/upload-market-favicons-to-oss.mjs`，用于将本地 favicon 批量上传到 OSS。
- 新增 `src/shared/market-favicon-remote-manifest.ts`，用于承载 OSS 远端 favicon 地址。

### 变更

- 市场工具图标读取顺序调整为“OSS 远端优先，本地图标兜底”，为后续市场资产云端化做准备。
- `README.md` 补充阿里云 OSS 配置模板、favicon 迁移步骤与命令说明。

### 新增

- 新增 App Router 页面入口：`/market`、`/pocket`、`/profile`，明确形成分析页、市场页、口袋页、个人中心页四页结构。
- 新增跨页通用页面骨架与导航能力，包括 `PageShell`、`TopNavSwitch`、`ProfileEntryPill`。
- 新增独立个人中心实现：`src/components/profile-page.tsx` 与 `src/app/profile/page.tsx`。
- 新增用户资料本地持久化与头像上传能力：`src/services/user-profile.ts`。
- 新增本地对话历史持久化能力：`src/services/chat-history.ts`。
- 新增 `commit-msg` 钩子与 `commitlint.config.js`，用于约束提交信息格式。
- 新增 `CHANGELOG.md`，从 `0.0.2` 开始记录版本级变更。

### 变更

- 将旧的未来规划文档重命名并收敛为 `GUIDE.md`，作为产品方向、优先级与 UED 原则的唯一依据。
- 重组分析页整体骨架，在统一顶栏下形成更稳定的双栏工作台结构。
- 收紧分析页桌面端纵向高度与底部留白，使页面更充分利用可视区域。
- 将市场页升级为“目录 + 展区”结构：
  - 桌面端左侧目录固定
  - 顶部搜索区固定
  - 右侧结果区独立纵向滚动
  - 平板与移动端补充横向分类导航
- 统一打磨市场页的目录区、搜索区与结果展区层级，让它们形成一致的“导航 / 展示”视觉语言。
- 将口袋页重新收敛为资产管理页，弱化与个人中心的职责重叠。
- 将个人中心从口袋页中拆分出来，重构为独立页面：
  - 左侧为主时间流
  - 右侧为紧凑画像与偏好侧栏
- 将页面品牌图统一为 `public/icon/pocket.png`。
- 将站点 metadata 图标从旧的 `dora-pocket.svg` 切换为 `pocket.png`。
- 收紧 sticky 顶栏与内容区之间的距离，移除顶部栏下方多余分隔线。
- 去掉市场页顶部搜索栏外层的白色圆角矩形容器，减轻顶部区域重量。
- 持续打磨 Discovery 与裁决相关组件，包括思考轨道与紧凑裁决结构。
- 更新 `README.md`、`GUIDE.md` 与 `TODO.md`，使文档与当前四页结构及交互现状保持一致。

### 移除

- 移除旧的 `ROADMAP.md`。
- 移除废弃图标文件 `public/icon/dora-pocket.svg`。
- 移除一批已不再使用的公共资源，包括：
  - `public/bookmarks_2026_4_14.html`
  - `public/file.svg`
  - `public/globe.svg`
  - `public/next.svg`
  - `public/vercel.svg`
  - `public/window.svg`
  - `public/image/dora (8).webp`
  - `public/image/test.png`
- 移除已经不属于当前产品结构的旧组件与基础 UI，包括：
  - `src/components/conversation-panel.tsx`
  - `src/components/user-center-page.tsx`
  - `src/components/ui/badge.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/scroll-area.tsx`
  - `src/components/ui/sheet.tsx`

### 修复

- 修复 `lint` warning：移除 `src/components/pocket-page.tsx` 中未使用的 `cn` 引入。
- 修复页面品牌资源不一致问题，使顶栏 logo 与站点图标统一。
- 修复市场页浏览依赖整页长滚动的问题，改为更稳定的局部滚动结构。
- 修复个人中心信息密度过高的问题，让关键信息更适合在首屏阅读。
- 修复分析页桌面端底部空白过大的问题，提升纵向利用率。
