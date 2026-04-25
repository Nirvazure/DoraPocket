# DoraPocket-Next

做陪伴你的哆啦A梦，我们每个人都可以是大雄。

DoraPocket 不是：

- 通用 AI 聊天机器人，只有情绪价值但不能给出具体帮助的陪聊产品
- 哆啦 A 梦皮肤的聊天壳，语音交互秀场，角色表演 Demo 
- 纯工具导航站，收藏夹升级版、RAG 工具百科

DoraPocket 是一个在用户需要帮助时，理解处境、掏出合适道具，并陪他完成下一步的陪伴式能力口袋，一个工具发现Agent。产品主线是让用户在需要帮助时被接住，并得到此刻最合适、最容易开始的帮助工具，聚焦“找工具 + 比较候选 + 做出裁决。它的长期目标不是停留在静态工具库或一次性推荐，而是逐步进化为一个融合世界知识、用户记忆、情境判断和群体反馈的掏口袋系统：随着使用不断变准、不断更懂用户，也越来越会在关键时刻出手。未来任何系统能力提升，最终都必须落到一个问题上：用户是否更容易在需要帮助时被接住。

## 技术概览

- 框架：`Next.js 16.2.4`
- UI 基础：`React 19.2.4`
- 语言：`TypeScript`
- 样式：`Tailwind CSS`
- Agent 能力：`LangChain` / `LangGraph`
- 大模型服务：`qwen`
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
npm run fetch:market-favicons
npm run upload:market-favicons
```

## 文档索引

- `GUIDE.md`：产品未来演进策略、阶段路线、开发原则唯一依据。
- `README.md`：项目概览、当前状态、本地启动。
- `AGENTS.md`：AI 协作边界与工程修改规则。
- `TODO.md`：当前实现后的近期优化记录与下一轮优先事项。