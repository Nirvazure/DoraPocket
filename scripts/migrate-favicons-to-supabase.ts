import 'dotenv/config'

import { createClient } from '@supabase/supabase-js'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { MARKET_FAVICON_REMOTE_MANIFEST } from './legacy-favicon-oss-manifest'
import {
  buildMarketAssetPublicUrl,
  getMarketAssetsBucketName,
} from '../src/shared/market-asset-url'
import { syncToolFavicon } from '../src/server/market/tool-favicon'

const connectionString = process.env.DATABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseSecret = process.env.SUPABASE_SECRET_KEY?.trim()
const bucket = getMarketAssetsBucketName()

if (!connectionString) throw new Error('DATABASE_URL is required')
if (!supabaseUrl || !supabaseSecret) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
const supabase = createClient(supabaseUrl, supabaseSecret, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function ensureMarketBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) throw new Error(`listBuckets: ${listError.message}`)
  if (buckets?.some((item) => item.name === bucket)) return

  const { error: createError } = await supabase.storage.createBucket(bucket, { public: true })
  if (createError) throw new Error(`createBucket(${bucket}): ${createError.message}`)
  console.log(`created bucket: ${bucket}`)
}

async function uploadObject(objectKey: string, body: Buffer, contentType: string) {
  const { error } = await supabase.storage.from(bucket).upload(objectKey, body, {
    contentType,
    upsert: true,
  })
  if (error) throw new Error(`${objectKey}: ${error.message}`)
  const publicUrl = buildMarketAssetPublicUrl(objectKey)
  if (!publicUrl) throw new Error('Failed to build public URL')
  return publicUrl
}

async function migrateManifestFavicons() {
  const entries = Object.entries(MARKET_FAVICON_REMOTE_MANIFEST)
  console.log(`migrate manifest favicons: ${entries.length}`)

  for (const [seedId, item] of entries) {
    const response = await fetch(item.faviconUrl)
    if (!response.ok) {
      console.warn(`  skip ${seedId}: fetch failed (${response.status})`)
      continue
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') ?? 'image/x-icon'
    const iconImageUrl = await uploadObject(item.faviconObjectKey, buffer, contentType)
    const toolId = `bookmark_${seedId}`

    const updated = await prisma.tool.updateMany({
      where: { id: toolId },
      data: {
        iconType: 'favicon',
        iconImageUrl,
        iconImageLocalPath: null,
      },
    })

    console.log(`  ${seedId} -> ${updated.count} row(s)`)
  }
}

async function backfillMissingFavicons() {
  const tools = await prisma.tool.findMany({
    where: {
      status: 'active',
      iconImageUrl: null,
      url: { not: null },
    },
    select: { id: true, url: true, name: true },
  })

  console.log(`backfill missing favicons: ${tools.length}`)
  for (const tool of tools) {
    if (!tool.url) continue
    await syncToolFavicon(tool.id, tool.url)
    const refreshed = await prisma.tool.findUnique({
      where: { id: tool.id },
      select: { iconImageUrl: true },
    })
    console.log(`  ${tool.id} (${tool.name}): ${refreshed?.iconImageUrl ? 'ok' : 'fallback emoji'}`)
  }
}

await ensureMarketBucket()
await migrateManifestFavicons()
await backfillMissingFavicons()
await prisma.$disconnect()

console.log('migrate:favicons complete')
