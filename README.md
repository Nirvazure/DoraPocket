# DoraPocket-Next

在用户需要帮助时，掏出合适道具的陪伴式能力口袋。当前阶段聚焦工具裁决与复用：帮助用户更快找到此刻最值得用的工具，解释为什么这样选，并把高价值帮助沉淀为下次可直接复用的资产。

## 产品定位

- DoraPocket 是陪伴式能力口袋，不是通用聊天机器人、角色表演 Demo、工具导航站、纯 RAG 工具百科或收藏夹升级版。
- 当前阶段聚焦“找工具 + 比较候选 + 做出裁决 + 给出下一步动作”。
- 产品主线是让用户在需要帮助时被接住，并得到此刻最合适、最容易开始、最值得复用的帮助。
- 详细未来策略、阶段路线、近期优先级与 UED 原则见 `GUIDE.md`。

## 当前状态

- 已从 Vite SPA 迁移到 Next.js App Router。
- 已补齐基础 BFF 路由：`POST /api/chat`、`POST /api/aliyun/tts`、`GET /api/aliyun/nls-token`。
- 分析页、市场页、口袋页、个人中心页已形成四页骨架。
- Agent 候选、推荐解释、市场浏览、口袋资产、对话历史、用户画像与偏好学习已经具备产品雏形。
- 口袋页已收敛为资产管理页，个人中心已独立拆分为 `/profile`，用于管理头像、完整对话历史、用户画像、偏好校准与行为回流。
- 四页已统一页面壳层与顶部导航，支持 `分析 / 市场 / 口袋 / 个人中心` 主导航切换，并在顶栏左侧使用口袋 logo 作为品牌 Avatar。
- 分析页已进一步压缩顶部与底部留白，桌面端更充分利用纵向高度。
- 市场页已重构为“左侧目录 / 右侧展区”布局：桌面端固定目录与搜索栏，右侧结果区独立滚动；小屏提供横向分类导航。
- 个人中心已重构为“左侧主时间流 + 右侧紧凑画像面板”，优先保证首屏信息完整度与阅读带连续性。
- 首页已加入 AI 裁决思考轨道，让意图识别、候选比较、偏好信号与裁决收敛变得可感知。
- 语音链路已强化为新会话会中断上一轮播放，按住说话改为更稳定的单一 Pointer 事件链。
- `GUIDE.md` 已整合未来方向、阶段路线、近期优先级与 UED 原则，作为产品策略唯一依据。

## 当前主线

- 强化单一主入口，让用户清楚从哪里开始、看哪里结果、下一步点哪里。
- 打磨“掏口袋时刻”，先给裁决结论，再给理由与动作。
- 推动分析、市场、口袋与 Agent 形成解释一致、动作连续的闭环。
- 优化跨页转场节奏、页面纵向利用率与空间连续感，降低“多个系统拼接”的观感。

## 技术概览

- 框架：`Next.js 16.2.4`
- UI 基础：`React 19.2.4`
- 语言：`TypeScript`
- 样式：`Tailwind CSS`
- Agent 能力：`LangChain` / `LangGraph`
- 状态管理：`Zustand`
- 3D 与角色：`Three.js` / `React Three Fiber` / `Drei`
- 语音链路：`Aliyun TTS` / `NLS`
- 质量控制：`ESLint`、`Prettier`、`Husky`、`lint-staged`

## 项目结构

```text
DoraPocket-Next/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                  # 首页裁决工作台
│  │  ├─ market/page.tsx           # 市场页
│  │  ├─ pocket/page.tsx           # 口袋资产页
│  │  ├─ profile/page.tsx          # 个人中心页
│  │  └─ api/                      # BFF 路由：chat、Aliyun TTS/NLS
│  ├─ components/
│  │  ├─ discovery/                # 掏口袋主链路与裁决组件
│  │  ├─ common/                   # 跨页通用顶栏
│  │  ├─ ui/                       # 当前实际使用的基础 UI
│  │  ├─ market-page.tsx           # 市场页主体验
│  │  ├─ pocket-page.tsx           # 口袋页主体验
│  │  └─ profile-page.tsx          # 个人中心主体验
│  ├─ server/
│  │  ├─ agent/                    # LangGraph 工具裁决链路
│  │  └─ aliyun/                   # NLS Token 服务
│  ├─ services/                    # 音频、TTS/STT、市场与口袋本地闭环
│  ├─ shared/                      # 市场类型、工具注册与模式注册
│  └─ store/                       # Zustand 全局状态
├─ public/
│  ├─ branding/                    # 品牌图形
│  ├─ icon/                        # App 图标
│  ├─ image/                       # 内置道具图
│  ├─ models/                      # 3D 角色模型
│  └─ worklets/                    # 语音采集 Worklet
└─ GUIDE.md                        # 产品未来演进唯一依据
```

## 技术栈判断

- 今晚不引入 `GSAP`：当前核心问题不是动效强度，而是语音稳定、裁决过程可感知、口袋资产化表达。
- 后续若要增强页面级过渡，优先评估 `Framer Motion`，用于跨页连续感与局部状态动效。
- 后续若接入远端市场、用户系统或数据库，优先评估 `TanStack Query`，用于缓存、请求状态与乐观更新。
- 后续若 Agent 状态机继续复杂化，可评估 `XState`，但当前 `LangGraph + UI Payload` 已足够支撑工具裁决主线。
- 后续若做真实推荐质量评估，可评估 `LangSmith` 或自建评测集，重点衡量适配度、可启动性、成功率、复用价值与信任感。
- 后续若要产品级观测，可评估 `PostHog` / `Sentry`，但不应早于“结果反馈回流排序”的闭环建设。

## 本地启动

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 常用命令

```bash
npm run lint
npm run lint:fix
npm run typecheck
npm run build
```

## 文档索引

- `GUIDE.md`：产品未来演进策略、阶段路线、近期优先级、UED 原则唯一依据。
- `README.md`：项目概览、当前状态、本地启动。
- `AGENTS.md`：AI 协作边界与工程修改规则。
- `TODO.md`：当前实现后的近期优化记录与下一轮优先事项。
