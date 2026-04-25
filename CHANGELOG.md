# 更新日志

本文档用于记录项目各版本的重要变更。

格式参考 Keep a Changelog，并以语义化版本作为实际发布记录方式。

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
