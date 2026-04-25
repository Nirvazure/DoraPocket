import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const bookmarksPath = path.join(repoRoot, 'public', 'bookmarks.html')
const outputDir = path.join(repoRoot, 'tmp')
const outputPath = path.join(outputDir, 'bookmark-seeds.generated.json')

const html = fs.readFileSync(bookmarksPath, 'utf8')

const bookmarkRegex = /<A[^>]*HREF="([^"]+)"[^>]*>(.*?)<\/A>/gims
const entries = []

for (const match of html.matchAll(bookmarkRegex)) {
  const href = match[1].trim()
  const title = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  entries.push({ href, title })
}

const excludedHostnames = new Set([
  'cloud.mongodb.com',
  'console.authing.cn',
  'app.open.qq.com',
  'dev.dcloud.net.cn',
  'github.com',
  'mp.weixin.qq.com',
  'hf.space',
])

const excludedUrlKeywords = [
  '/login',
  '/authorize',
  '/workspace',
  '/projects/',
  '/rodin/',
  '#/clusters/detail/',
]

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80)
}

function inferCategory(text) {
  if (/(pdf|regex|vite|tauri|wails|langgraph|开发|组件|图表|icon|favicon|ui|代码)/i.test(text)) return 'developer'
  if (/(design|figma|主题|动画|图标|3d|模型|素材|抠图|motion)/i.test(text)) return 'design'
  if (/(搜索|reader|readwise|aminer|learn|文档|guide|资料|算法|学习)/i.test(text)) return 'learning'
  if (/(视频|音乐|comic|image|图片|音频|ambient|白噪音)/i.test(text)) return 'media'
  if (/(翻译|readme|写作|summary|prompt)/i.test(text)) return 'writing'
  if (/(workflow|n8n|dify|agent|ai|搜索|助手)/i.test(text)) return 'ai_assistant'
  return 'productivity'
}

function inferSourceType(text) {
  if (/(awwwards|portfolio|tokyo|inspiration|灵感|播客)/i.test(text)) return 'inspiration'
  if (/(docs|guide|文档|archive|search|learn|资料)/i.test(text)) return 'resource'
  return 'tool'
}

function shouldExclude(url, hostname) {
  if (excludedHostnames.has(hostname)) return true
  return excludedUrlKeywords.some((keyword) => url.includes(keyword))
}

const generated = entries.map((entry) => {
  const url = new URL(entry.href)
  const hostname = url.hostname
  const homepageUrl = `${url.protocol}//${hostname}/`
  const text = `${entry.title} ${entry.href}`
  return {
    seedId: slugify(hostname),
    bookmarkTitle: entry.title,
    bookmarkUrl: entry.href,
    homepageUrl,
    siteHostname: hostname,
    category: inferCategory(text),
    sourceType: inferSourceType(text),
    excluded: shouldExclude(entry.href, hostname),
  }
})

fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(generated, null, 2))
console.log(`Generated ${generated.length} bookmark seed candidates -> ${path.relative(repoRoot, outputPath)}`)
