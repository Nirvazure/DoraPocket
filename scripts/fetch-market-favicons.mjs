import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import http from 'node:http'

const repoRoot = process.cwd()
const seedsModulePath = path.join(repoRoot, 'src', 'shared', 'market-bookmark-seeds.ts')
const outputDir = path.join(repoRoot, 'public', 'market-favicons')
const manifestTsPath = path.join(repoRoot, 'src', 'shared', 'market-favicon-manifest.ts')
const manifestJsonPath = path.join(outputDir, 'manifest.json')
const REQUEST_TIMEOUT_MS = 12000

function requestBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https:') ? https : http
    const req = client.get(url, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          resolve(requestBuffer(new URL(response.headers.location, url).toString()))
          return
        }
        if (!response.statusCode || response.statusCode >= 400) {
          reject(new Error(`Request failed: ${response.statusCode} ${url}`))
          return
        }
        const chunks = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => resolve(Buffer.concat(chunks)))
      })
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`Timeout after ${REQUEST_TIMEOUT_MS}ms: ${url}`))
    })
    req.on('error', reject)
  })
}

function requestText(url) {
  return requestBuffer(url).then((buffer) => buffer.toString('utf8'))
}

function extractIconHref(html, baseUrl) {
  const linkRegex = /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i
  const appleRegex = /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i
  const manifestRegex = /<link[^>]+rel=["'][^"']*manifest[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/i
  const href = html.match(linkRegex)?.[1] ?? html.match(appleRegex)?.[1] ?? html.match(manifestRegex)?.[1]
  if (!href) return null
  return new URL(href, baseUrl).toString()
}

async function loadSeeds() {
  const source = fs.readFileSync(seedsModulePath, 'utf8')
  const arraySource = source.match(/export const MARKET_BOOKMARK_SEEDS = (\[[\s\S]*\]) satisfies readonly MarketBookmarkSeed\[\]/)?.[1]
  if (!arraySource) throw new Error('Cannot parse MARKET_BOOKMARK_SEEDS')
  return Function(`return ${arraySource}`)()
}

function extnameFromUrl(url) {
  const pathname = new URL(url).pathname
  const ext = path.extname(pathname).toLowerCase()
  if (ext === '.svg' || ext === '.png' || ext === '.ico' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp') return ext
  return '.ico'
}

async function main() {
  const seeds = await loadSeeds()
  fs.mkdirSync(outputDir, { recursive: true })

  const existingManifest = fs.existsSync(manifestJsonPath) ? JSON.parse(fs.readFileSync(manifestJsonPath, 'utf8')) : []
  const seedIds = new Set(seeds.map((seed) => seed.seedId))
  const manifestMap = new Map(existingManifest.filter((entry) => seedIds.has(entry.seedId)).map((entry) => [entry.seedId, entry]))
  for (const seed of seeds) {
    const existing = manifestMap.get(seed.seedId)
    if (existing?.faviconLocalPath && existing.faviconLocalPath !== '/market-favicons/_default.png') {
      console.log(`${seed.seedId}: cached -> ${existing.faviconLocalPath}`)
      continue
    }

    const homepage = seed.homepageUrl || seed.displayUrl
    let iconUrl = null
    let faviconMode = 'fallback'
    try {
      const html = await requestText(homepage)
      iconUrl = extractIconHref(html, homepage)
      if (iconUrl) faviconMode = 'site_icon'
    } catch {
      iconUrl = null
    }

    if (!iconUrl) {
      iconUrl = new URL('/favicon.ico', homepage).toString()
      faviconMode = 'root_favicon'
    }

    let localPath = null
    try {
      const buffer = await requestBuffer(iconUrl)
      const ext = extnameFromUrl(iconUrl)
      const fileName = `${seed.seedId}${ext}`
      const filePath = path.join(outputDir, fileName)
      fs.writeFileSync(filePath, buffer)
      localPath = `/market-favicons/${fileName}`
    } catch {
      faviconMode = 'fallback'
      localPath = '/market-favicons/_default.png'
    }

    manifestMap.set(seed.seedId, {
      seedId: seed.seedId,
      faviconMode,
      faviconUrl: iconUrl,
      faviconLocalPath: localPath,
    })
    console.log(`${seed.seedId}: ${faviconMode} -> ${localPath}`)
    fs.writeFileSync(manifestJsonPath, JSON.stringify([...manifestMap.values()], null, 2))
  }

  const manifest = [...manifestMap.values()].sort((a, b) => a.seedId.localeCompare(b.seedId))
  fs.writeFileSync(manifestJsonPath, JSON.stringify(manifest, null, 2))
  const manifestTs =
    "export const MARKET_FAVICON_MANIFEST = " +
    JSON.stringify(
      Object.fromEntries(
        manifest.map((entry) => [
          entry.seedId,
          {
            faviconMode: entry.faviconMode,
            faviconUrl: entry.faviconUrl,
            faviconLocalPath: entry.faviconLocalPath,
          },
        ]),
      ),
      null,
      2,
    ) +
    " as const\n"
  fs.writeFileSync(manifestTsPath, manifestTs)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
