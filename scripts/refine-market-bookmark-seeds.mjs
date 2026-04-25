import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const seedFilePath = path.join(repoRoot, 'src', 'shared', 'market-bookmark-seeds.ts')

const brandNameMap = {
  'asoftmurmur.com': 'A Soft Murmur',
  'aicomicfactory.com': 'AI Comic Factory',
  'www.ai-elements-vue.com': 'AI Elements Vue',
  'amazing-apps.gitbook.io': 'Windows Amazing Apps',
  'www.ambient-mixer.com': 'Ambient Mixer',
  'www.aminer.cn': 'AMiner',
  'dev.animaapp.com': 'Anima',
  'animate.style': 'Animate.css',
  'antd-design-x-vue.netlify.app': 'Ant Design X Vue',
  'anyway.fm': 'Anyway.FM',
  'askgo.ai': 'AskGo',
  'www.autohanding.com': '凹凸工坊手写转换',
  'www.awwwards.com': 'Awwwards',
  'www.babylonjs.com': 'Babylon.js',
  'bananaprompts.fun': 'Banana Prompts',
  'www.bestpartygames.net': 'Best Party Games',
  'cactusdigitale.com': 'Cactus Digitale',
  'carbon.now.sh': 'Carbon',
  'www.chakra-ui.com': 'Chakra UI',
  'pro.chakra-ui.com': 'Chakra UI Pro',
  'docs.cherry-ai.com': 'Cherry Studio 文档',
  'cobalt.tools': 'cobalt',
  'www.codebuddy.cn': 'CodeBuddy',
  'convertio.com': 'Convertio',
  'd3js.org': 'D3.js',
  'www.davidlubofsky.com': 'David Lubofsky 作品集',
  'docs.dify.ai': 'Dify 文档',
  'www.dyad.sh': 'Dyad',
  'help.figma.com': 'Figma 帮助中心',
  'www.flaticon.com': 'Flaticon',
  'stitch.withgoogle.com': 'Google Stitch',
  'hera.video': 'Hera',
  'highlightjs.org': 'highlight.js',
  'huggingface.co': 'Hugging Face',
  'hyper3d.ai': 'Hyper3D',
  'tools.iplocation.net': 'Image Tools',
  'inversa.com': 'Inversa',
  'it-tools.tech': 'IT Tools',
  'jimeng.jianying.com': '即梦 AI',
  'www.jiumodiary.com': 'Jiumo Search',
  'docs.kanaries.net': 'Kanaries 文档',
  'app.klingai.com': '可灵 AI',
  'langgraph.com.cn': 'LangGraph 中文站',
  'learn-anything.xyz': 'Learn Anything',
  'docs.lizardbyte.dev': 'LizardByte 文档',
  'lucide.dev': 'Lucide',
  'masonry.desandro.com': 'Masonry',
  'usememos.com': 'Memos',
  'www.meshy.ai': 'Meshy',
  'metaso.cn': '秘塔 AI 搜索',
  'n8n.io': 'n8n',
  'nuwa.world': 'Nuwa',
  'tools.pdf24.org': 'PDF24 Tools',
  'www.pencil.dev': 'Pencil',
  'primevue.org': 'PrimeVue',
  'profile-readme-generator.com': 'Profile Readme Generator',
  'www.pyspur.com': 'PySpur',
  'read.useai.online': 'Reader AI',
  'readwise.io': 'Readwise Reader',
  'regex101.com': 'Regex101',
  'www.remove.bg': 'remove.bg',
  'remove.photos': 'RemovePhotos',
  'retejs.org': 'Rete.js',
  'revizepic.pixzens.com': 'RevizePic',
  'rows.com': 'Rows',
  'sealos.io': 'Sealos',
  'smithery.ai': 'Smithery',
  'sniffnet.net': 'Sniffnet',
  'sap-doc.nasdaddy.com': 'Social Auto Upload',
  'www.stagehand.dev': 'Stagehand',
  'suno.com': 'Suno',
  'www.tailwindcss.cn': 'Tailwind CSS 中文网',
  'v2.tauri.app': 'Tauri',
  'tensorflow.google.cn': 'TensorFlow.js',
  'threejs.org': 'Three.js',
  'tinywow.com': 'TinyWow',
  'tweakcn.com': 'tweakcn',
  'uiverse.io': 'Uiverse',
  'umijs.org': 'UmiJS',
  'www.utopiatokyo.com': 'Utopia Tokyo',
  'www.uxbot.cn': 'Uxbot',
  'v0.app': 'v0',
  'www.valdi.ai': 'VALDI',
  'docs.videolingo.io': 'VideoLingo 文档',
  'www.vidu.cn': 'Vidu AI',
  'visualgo.net': 'VisuAlgo',
  'cn.vitejs.dev': 'Vite',
  'vitepress.dev': 'VitePress',
  'vue-bits.dev': 'Vue Bits',
  'vue-data-ui.graphieros.com': 'Vue Data UI',
  'vuesax.com': 'Vuesax',
  'vuetifyjs.com': 'Vuetify',
  'lux.vuetify3.com': 'Vuetify Lux',
  'wails.io': 'Wails',
  'www.zingchart.com': 'ZingChart',
}

const categoryTagMap = {
  ai_assistant: ['AI 助手', '生成式工具', '任务辅助'],
  search: ['搜索研究', '资料检索', '信息判断'],
  developer: ['开发者工具', '工程效率', '前端能力'],
  design: ['设计素材', '界面构建', '视觉表达'],
  productivity: ['效率工具', '任务闭环', '轻量办公'],
  media: ['媒体处理', '内容创作', '生成编辑'],
  learning: ['学习资料', '文档参考', '知识补给'],
  writing: ['写作翻译', '文本处理', '表达辅助'],
}

const categoryCapabilityMap = {
  ai_assistant: ['辅助创作', '任务组织', '能力扩展'],
  search: ['搜索检索', '研究判断', '信息收敛'],
  developer: ['开发实现', '调试验证', '组件选型'],
  design: ['设计生产', '素材获取', '界面搭建'],
  productivity: ['效率提升', '任务处理', '小闭环执行'],
  media: ['图片视频处理', '内容创作', '生成编辑'],
  learning: ['学习理解', '文档查阅', '知识补给'],
  writing: ['写作翻译', '文本整理', '表达增强'],
}

const sourceTypeTags = {
  tool: ['可直接使用'],
  resource: ['参考资源'],
  inspiration: ['灵感参考'],
}

const sourceTypeRecommendedFor = {
  tool: ['直接打开使用', '快速尝试', '补进候选池'],
  resource: ['查文档', '补背景知识', '作为说明依据'],
  inspiration: ['找灵感', '看案例风格', '扩展表达方式'],
}

const hostSpecificTags = {
  'www.chakra-ui.com': ['React UI', '组件库', '设计系统'],
  'lucide.dev': ['图标库', 'SVG', '设计系统'],
  'vue-data-ui.graphieros.com': ['Vue 图表', '数据可视化', '组件'],
  'pro.chakra-ui.com': ['页面区块', '后台模板', 'UI 参考'],
  'www.babylonjs.com': ['Web 3D', '引擎', '交互演示'],
  'retejs.org': ['可视化编排', '节点编辑器', '工作流'],
  'highlightjs.org': ['代码高亮', '文档展示', '前端集成'],
  'threejs.org': ['3D 引擎', 'WebGL', '场景渲染'],
  'www.tailwindcss.cn': ['Tailwind', '原子化 CSS', '中文文档'],
  'vuetifyjs.com': ['Vue UI', 'Material Design', '组件库'],
  'd3js.org': ['数据可视化', '图表定制', 'JavaScript'],
  'tensorflow.google.cn': ['浏览器 AI', '机器学习', '演示案例'],
  'cn.vitejs.dev': ['前端构建', '工程工具', '中文文档'],
  'umijs.org': ['企业前端', '框架', '插件化'],
  'animate.style': ['CSS 动画', '界面动效', '前端样式'],
  'tweakcn.com': ['主题编辑', 'shadcn/ui', '设计系统'],
  'vue-bits.dev': ['Vue UI', '动效组件', '界面增强'],
  'carbon.now.sh': ['代码截图', '分享素材', '开发展示'],
  'www.zingchart.com': ['图表库', '可视化', '前端集成'],
  'vuesax.com': ['Vue UI', '组件文档', '界面库'],
  'masonry.desandro.com': ['瀑布流布局', '前端布局', '视觉编排'],
  'primevue.org': ['Vue UI', '企业组件', '前端开发'],
  'langgraph.com.cn': ['Agent 编排', 'LangGraph', '中文资料'],
  'antd-design-x-vue.netlify.app': ['AI 界面', 'Vue 组件', '对话 UI'],
  'www.ai-elements-vue.com': ['AI 组件', 'Vue', '产品界面'],
  'docs.lizardbyte.dev': ['文档', '技术说明', '参考资料'],
  'amazing-apps.gitbook.io': ['Windows 应用', '工具收集', '参考清单'],
  'anyway.fm': ['设计播客', '产品思考', '灵感输入'],
  'visualgo.net': ['算法可视化', '学习工具', '数据结构'],
  'stitch.withgoogle.com': ['AI 生成界面', '原型设计', '实验产品'],
  'www.awwwards.com': ['网页灵感', '视觉趋势', '案例库'],
  'help.figma.com': ['Figma', '官方文档', 'MCP 参考'],
  'huggingface.co': ['模型社区', 'AI 资料', '开源生态'],
  'www.codebuddy.cn': ['AI 办公', 'Agent 工作流', '国产工具'],
  'www.dyad.sh': ['本地 AI 开发', '开源构建', '应用生成'],
  'www.stagehand.dev': ['浏览器自动化', 'LLM 集成', '开发 SDK'],
  'www.valdi.ai': ['算力平台', 'GPU 资源', '云服务'],
  'jimeng.jianying.com': ['AI 视频图像', '创意生成', '内容创作'],
  'app.klingai.com': ['AI 视频', '创意生成', '内容制作'],
  'askgo.ai': ['AI 搜索', '问答研究', '信息检索'],
  'v0.app': ['AI 前端生成', '界面搭建', '快速原型'],
  'v2.tauri.app': ['桌面应用', 'Rust + Web', '框架文档'],
  'wails.io': ['桌面应用', 'Go + Web', '开发框架'],
  'rows.com': ['AI 表格', '数据分析', '协作效率'],
  'n8n.io': ['自动化', '工作流', 'Agent 编排'],
  'docs.dify.ai': ['LLM 应用', '工作流', '官方文档'],
  'usememos.com': ['轻量笔记', '个人记录', '知识沉淀'],
  'suno.com': ['AI 音乐', '音频生成', '创作工具'],
  'smithery.ai': ['MCP 市场', 'Agent 扩展', '工具发现'],
  'www.meshy.ai': ['AI 3D', '模型生成', '素材制作'],
  'metaso.cn': ['AI 搜索', '中文检索', '研究判断'],
  'bananaprompts.fun': ['提示词库', '创作启发', 'Prompt 参考'],
  'hyper3d.ai': ['AI 3D', '图像转模型', '内容创作'],
  'aicomicfactory.com': ['漫画生成', '叙事创作', '图像生成'],
  'tools.pdf24.org': ['PDF 处理', '办公工具', '格式转换'],
  'regex101.com': ['正则调试', '开发验证', '表达式测试'],
  'www.flaticon.com': ['图标素材', '设计资产', '界面资源'],
  'uiverse.io': ['UI 元素', '开源组件', '界面灵感'],
  'www.uxbot.cn': ['AI 应用生成', '低代码', '原型搭建'],
  'convertio.com': ['格式转换', '办公效率', '文件处理'],
  'hera.video': ['动效生成', 'Motion Design', '视频创作'],
  'vitepress.dev': ['文档站', '前端工具', '静态站生成'],
  'www.pencil.dev': ['设计转代码', '原型落地', 'AI 工具'],
}

const hostSpecificDescriptions = {
  'www.chakra-ui.com': 'React 组件库，适合做管理后台、工具页和设计系统原型。',
  'lucide.dev': '开源图标库，适合快速补齐界面图标与统一视觉语言。',
  'vue-data-ui.graphieros.com': 'Vue 数据可视化组件集合，适合快速搭建图表与仪表盘界面。',
  'pro.chakra-ui.com': 'Chakra UI Pro 页面区块库，适合找后台、列表与营销页结构参考。',
  'www.babylonjs.com': 'Web 3D 引擎与演示集合，适合探索浏览器端 3D 交互能力。',
  'retejs.org': '可视化节点编辑框架，适合做工作流编排、流程搭建和可视化逻辑编辑。',
  'highlightjs.org': '代码高亮库，适合文档站、教程页和代码展示场景。',
  'threejs.org': '前端 3D 引擎，适合场景渲染、可视化体验和交互式展示。',
  'www.tailwindcss.cn': 'Tailwind CSS 中文资料站，适合快速查类名与原子化样式写法。',
  'vuetifyjs.com': 'Vue Material Design 组件库，适合中后台和复杂表单页面。',
  'd3js.org': '高自由度数据可视化库，适合做定制图表与复杂可视化表达。',
  'tensorflow.google.cn': 'TensorFlow.js 中文入口，适合了解浏览器端 AI 能力与示例。',
  'cn.vitejs.dev': 'Vite 中文文档，适合查前端工程、构建与开发服务器相关内容。',
  'umijs.org': '企业级前端框架，适合中后台项目、路由组织与插件化工程。',
  'animate.style': '现成 CSS 动画库，适合快速给界面补基础动效。',
  'tweakcn.com': 'shadcn/ui 主题编辑器，适合快速试主题和调整设计风格。',
  'vue-bits.dev': 'Vue 动效 UI 组件集合，适合为界面增加细节表现。',
  'carbon.now.sh': '代码截图美化工具，适合分享代码片段与制作演示素材。',
  'www.zingchart.com': '图表库，适合快速接入常见商业图表能力。',
  'vuesax.com': 'Vue 组件库文档站，适合查组件用法与风格参考。',
  'masonry.desandro.com': '瀑布流布局方案，适合图片流和卡片式编排场景。',
  'primevue.org': 'Vue 企业级组件库，适合复杂表单、表格和后台系统。',
  'langgraph.com.cn': 'LangGraph 中文资料站，适合了解 Agent 状态机与编排思路。',
  'antd-design-x-vue.netlify.app': 'Ant Design X 的 Vue 方向实践，适合 AI 产品界面参考。',
  'www.ai-elements-vue.com': '面向 AI 产品的 Vue 组件集合，适合对话与助手类界面搭建。',
  'amazing-apps.gitbook.io': 'Windows 优质应用清单，适合补充工具市场的发现视角。',
  'anyway.fm': '设计播客，适合输入产品、设计与创作层面的长期思考。',
  'visualgo.net': '算法与数据结构可视化工具，适合学习、讲解与快速回顾。',
  'stitch.withgoogle.com': 'Google 的 AI 原型生成产品，适合观察界面生成方向。',
  'www.awwwards.com': '高质量网页案例站，适合找视觉、动效与交互灵感。',
  'help.figma.com': 'Figma 官方帮助中心，适合查设计协作与 MCP 相关说明。',
  'huggingface.co': '模型与 AI 应用社区，适合查模型、Demo 与生态资料。',
  'www.codebuddy.cn': 'AI Agent 办公工具，适合观察国产工作流与智能办公产品。',
  'www.dyad.sh': '本地开源 AI 应用构建器，适合快速验证 AI 产品原型。',
  'www.stagehand.dev': '浏览器自动化 SDK，适合 LLM 操作网页和自动化执行场景。',
  'www.valdi.ai': '算力与存储平台，适合需要 GPU 资源的 AI 项目准备阶段。',
  'jimeng.jianying.com': '即梦 AI 创作平台，适合图像、视频等创意内容生成。',
  'app.klingai.com': '可灵 AI 视频创作平台，适合生成与试验动态内容。',
  'askgo.ai': 'AI 搜索与问答工具，适合快速查资料并继续追问。',
  'v0.app': 'Vercel 的 AI 前端生成工具，适合搭建页面雏形与组件原型。',
  'v2.tauri.app': 'Tauri 官方文档，适合桌面应用方向的技术选型与开发入门。',
  'wails.io': 'Wails 官方站，适合 Go + Web 桌面应用方向的框架了解。',
  'rows.com': 'AI 表格与数据分析平台，适合轻分析、表格自动化和协作处理。',
  'n8n.io': '自动化工作流平台，适合把多工具串起来形成可复用流程。',
  'docs.dify.ai': 'Dify 官方文档，适合查 LLM 应用编排、Agent 与工作流能力。',
  'usememos.com': '轻量个人知识记录工具，适合快速沉淀笔记与灵感片段。',
  'suno.com': 'AI 音乐创作平台，适合快速生成音乐草稿与音频灵感。',
  'smithery.ai': 'MCP 服务市场，适合探索可接入的外部能力与 Agent 扩展。',
  'www.meshy.ai': 'AI 3D 模型生成工具，适合快速做概念模型与素材试验。',
  'metaso.cn': '中文 AI 搜索工具，适合快速找信息、做判断和补上下文。',
  'bananaprompts.fun': '提示词库，适合找创作灵感与参考已有 Prompt 模式。',
  'hyper3d.ai': 'AI 3D 生成产品，适合图像转模型与 3D 素材探索。',
  'aicomicfactory.com': 'AI 漫画生成工具，适合做轻叙事内容和画面试验。',
  'tools.pdf24.org': 'PDF 工具箱，适合合并、拆分、压缩与格式转换。',
  'regex101.com': '正则调试工具，适合测试表达式、解释规则和快速验证。',
  'www.flaticon.com': '图标素材库，适合补 UI 图标和界面装饰元素。',
  'uiverse.io': '开源 UI 元素社区，适合找小组件、交互动效和样式灵感。',
  'www.uxbot.cn': 'AI Web App 生成平台，适合快速把想法变成可演示原型。',
  'convertio.com': '文件格式转换工具，适合轻办公和素材格式整理。',
  'hera.video': 'AI 动效设计工具，适合生成 motion 片段与动态视觉素材。',
  'vitepress.dev': '文档站生成工具，适合搭建说明站、知识库和项目文档。',
  'www.pencil.dev': '设计转代码工具，适合从视觉方案走向可落地界面。',
}

function renderTs(value, indent = 0) {
  const spacing = ' '.repeat(indent)
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value === null) return 'null'
  if (Array.isArray(value)) return `[${value.map((item) => renderTs(item, indent)).join(', ')}]`
  return `{\n${Object.entries(value)
    .map(([key, nested]) => `${spacing}  ${key}: ${renderTs(nested, indent + 2)}`)
    .join(',\n')}\n${spacing}}`
}

function extractSeeds() {
  const source = fs.readFileSync(seedFilePath, 'utf8')
  const arraySource = source.match(/export const MARKET_BOOKMARK_SEEDS = (\[[\s\S]*\]) satisfies readonly MarketBookmarkSeed\[\]/)?.[1]
  if (!arraySource) throw new Error('Cannot parse MARKET_BOOKMARK_SEEDS')
  return Function(`return ${arraySource}`)()
}

function fallbackDescription(seed, name) {
  const byCategory = {
    ai_assistant: '适合借助 AI 能力完成创作、整理或任务辅助。',
    search: '适合查资料、做研究和收敛信息判断。',
    developer: '适合开发实现、工程提效和组件选型。',
    design: '适合设计生产、素材获取和界面表达。',
    productivity: '适合提高效率、完成轻量办公和小闭环任务。',
    media: '适合图片、视频、音频或 3D 内容处理与创作。',
    learning: '适合作为学习资料、文档说明或背景知识补给。',
    writing: '适合写作、翻译、总结和文本处理。',
  }
  return `${name}，${byCategory[seed.category] ?? '适合完成明确的小任务。'}`
}

function refineSeed(seed) {
  const host = seed.siteHostname
  const name = brandNameMap[host] ?? seed.name
  const description = hostSpecificDescriptions[host] ?? fallbackDescription(seed, name)
  const tags = hostSpecificTags[host] ?? [...new Set([...(categoryTagMap[seed.category] ?? []), ...(sourceTypeTags[seed.sourceType] ?? [])])].slice(0, 4)
  const capabilities = [...new Set([...(hostSpecificTags[host] ?? tags), ...(categoryCapabilityMap[seed.category] ?? [])])].slice(0, 4)
  const recommendedFor = [
    ...(seed.sourceType === 'tool'
      ? (hostSpecificTags[host] ?? tags).slice(0, 2).map((tag) => `需要${tag}`)
      : []),
    ...(sourceTypeRecommendedFor[seed.sourceType] ?? []),
  ].slice(0, 3)

  return {
    ...seed,
    name,
    description,
    tags,
    capabilities,
    recommendedFor,
    sourceNote: '来自 bookmarks.html 的首批人工筛选种子资产，用于扩展市场候选池。',
    seedNotes: '种子数据只用于提供候选资产，不直接决定 DoraPocket 的智能推荐结论。',
  }
}

const refinedSeeds = extractSeeds().map(refineSeed)

const lines = ["import type { MarketBookmarkSeed } from '@/shared/market-seed-types'", '', 'export const MARKET_BOOKMARK_SEEDS = [']
for (const seed of refinedSeeds) {
  lines.push('  {')
  for (const [key, value] of Object.entries(seed)) {
    lines.push(`    ${key}: ${renderTs(value, 4)},`)
  }
  lines.push('  },')
}
lines.push('] satisfies readonly MarketBookmarkSeed[]', '')

fs.writeFileSync(seedFilePath, lines.join('\n'))
console.log(`Refined ${refinedSeeds.length} bookmark seeds.`)
