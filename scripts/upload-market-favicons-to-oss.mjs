import fs from 'node:fs'
import path from 'node:path'
import OSS from 'ali-oss'

const repoRoot = process.cwd()
const localManifestPath = path.join(repoRoot, 'public', 'market-favicons', 'manifest.json')
const remoteManifestTsPath = path.join(repoRoot, 'src', 'shared', 'market-favicon-remote-manifest.ts')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue
    const key = trimmed.slice(0, separatorIndex).trim()
    const rawValue = trimmed.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.join(repoRoot, '.env'))
loadEnvFile(path.join(repoRoot, '.env.local'))

const requiredEnvKeys = [
  'ALIYUN_OSS_REGION',
  'ALIYUN_OSS_BUCKET',
  'ALIYUN_OSS_PUBLIC_BASE_URL',
]

for (const key of requiredEnvKeys) {
  if (!process.env[key]) {
    throw new Error(`Missing required env: ${key}`)
  }
}

const accessKeyId = process.env.ALIYUN_OSS_ACCESS_KEY_ID || process.env.ALIYUN_AK_ID
const accessKeySecret = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || process.env.ALIYUN_AK_SECRET

if (!accessKeyId) {
  throw new Error('Missing required env: ALIYUN_OSS_ACCESS_KEY_ID or ALIYUN_AK_ID')
}

if (!accessKeySecret) {
  throw new Error('Missing required env: ALIYUN_OSS_ACCESS_KEY_SECRET or ALIYUN_AK_SECRET')
}

const prefix = (process.env.ALIYUN_OSS_FAVICON_PREFIX || 'market-favicons/').replace(/^\/+/, '')
const publicBaseUrl = process.env.ALIYUN_OSS_PUBLIC_BASE_URL.replace(/\/+$/, '')

const client = new OSS({
  region: process.env.ALIYUN_OSS_REGION,
  bucket: process.env.ALIYUN_OSS_BUCKET,
  accessKeyId,
  accessKeySecret,
  endpoint: process.env.ALIYUN_OSS_ENDPOINT || undefined,
})

function loadLocalManifest() {
  if (!fs.existsSync(localManifestPath)) {
    throw new Error('Local favicon manifest not found. Run fetch:market-favicons first.')
  }
  return JSON.parse(fs.readFileSync(localManifestPath, 'utf8'))
}

function filePathFromPublicPath(publicPath) {
  return path.join(repoRoot, 'public', publicPath.replace(/^\/+/, '').replaceAll('/', path.sep))
}

function buildObjectKey(publicPath) {
  return `${prefix}${publicPath.replace(/^\/?market-favicons\/?/, '')}`
}

function contentTypeFromExt(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.ico') return 'image/x-icon'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  return 'application/octet-stream'
}

async function uploadOne(publicPath) {
  const localPath = filePathFromPublicPath(publicPath)
  if (!fs.existsSync(localPath)) {
    throw new Error(`Missing local favicon file: ${publicPath}`)
  }
  const objectKey = buildObjectKey(publicPath)
  await client.put(objectKey, localPath, {
    headers: {
      'Content-Type': contentTypeFromExt(localPath),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
  return {
    faviconStorage: 'oss',
    faviconObjectKey: objectKey,
    faviconUrl: `${publicBaseUrl}/${objectKey}`,
  }
}

async function main() {
  const localManifest = loadLocalManifest()
  const remoteManifest = {}

  for (const entry of localManifest) {
    if (!entry.faviconLocalPath || entry.faviconLocalPath === '/market-favicons/_default.png') continue
    const uploaded = await uploadOne(entry.faviconLocalPath)
    remoteManifest[entry.seedId] = uploaded
    console.log(`${entry.seedId} -> ${uploaded.faviconUrl}`)
  }

  const tsSource =
    "export const MARKET_FAVICON_REMOTE_MANIFEST: Record<string, { faviconStorage: 'oss'; faviconObjectKey: string; faviconUrl: string }> = " +
    JSON.stringify(remoteManifest, null, 2) +
    '\n'

  fs.writeFileSync(remoteManifestTsPath, tsSource)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
