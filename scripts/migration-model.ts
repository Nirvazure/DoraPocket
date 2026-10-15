import { createHash } from 'node:crypto'

export const SOURCE_REF = 'eatsznumylwggpvlwkfk'
export const TARGET_REF = 'tfvzcuksahcofooqqezx'
export const TARGET_SCHEMA = 'dorapocket'
export const TARGET_BUCKET = 'dorapocket-market-assets'
export type MigratedTool = {
  id: string
  name: string
  url: string
  description: string
  category: string
  tags: string[]
  iconUrl: string | null
  status: 'active' | 'inactive'
  pricingModel: string
  requiresAuth: boolean | null
  platform: string
  createdAt: string
  updatedAt: string
}
export type Asset = { sourceUrl: string; targetUrl: string; objectKey: string; sha256?: string }

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}
function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : []
}
export function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}
function date(value: unknown): string {
  const raw = text(value)
  const utc = raw && !/(?:z|[+-]\d\d:?\d\d)$/iu.test(raw) ? `${raw}Z` : raw
  const parsed = new Date(value instanceof Date ? value : utc)
  if (!Number.isFinite(parsed.getTime()))
    throw new Error('Tool timestamp is invalid; export stopped')
  return parsed.toISOString()
}
function httpUrl(value: unknown): string | null {
  const raw = text(value)
  try {
    const url = new URL(raw)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? raw : null
  } catch {
    return null
  }
}

export function convertTool(row: Record<string, unknown>): MigratedTool | null {
  const url = httpUrl(row.url)
  if (
    !url ||
    row.executionMode === 'reference_only' ||
    row.source === 'external_resource' ||
    ['documentation', 'tutorial', 'reference'].includes(text(row.category))
  )
    return null
  if (!text(row.id) || !text(row.name)) throw new Error('Tool ID/name missing; export stopped')
  const trust =
    row.trustSignals && typeof row.trustSignals === 'object'
      ? (row.trustSignals as Record<string, unknown>)
      : {}
  const parts: string[] = []
  for (const entry of [
    text(row.description),
    ...strings(row.capabilities),
    ...strings(row.recommendedFor),
    text(row.sourceNote),
    text(trust.riskNote),
  ]) {
    const normalized = entry.toLocaleLowerCase().replace(/[\s。.!！]+$/gu, '')
    if (
      entry &&
      !parts.some((part) => part.toLocaleLowerCase().replace(/[\s。.!！]+$/gu, '') === normalized)
    )
      parts.push(entry)
  }
  const categories = [
    'ai_assistant',
    'search',
    'developer',
    'design',
    'productivity',
    'media',
    'learning',
    'writing',
    'other',
  ]
  const icon =
    [row.iconUrl, row.iconImageUrl, row.iconImageLocalPath, row.icon]
      .map(text)
      .find((value) => httpUrl(value) || (value.startsWith('/') && !value.startsWith('//'))) || null
  return {
    id: text(row.id),
    name: text(row.name),
    url,
    description: parts.join('\n\n'),
    category: categories.includes(text(row.category)) ? text(row.category) : 'other',
    tags: [...new Set(strings(row.tags))],
    iconUrl: icon,
    status: row.status === 'active' ? 'active' : 'inactive',
    pricingModel: ['free', 'freemium', 'paid', 'subscription'].includes(text(row.pricingModel))
      ? text(row.pricingModel)
      : 'unknown',
    requiresAuth: typeof row.requiresAuth === 'boolean' ? row.requiresAuth : null,
    platform: ['web', 'desktop', 'mobile', 'api', 'mixed'].includes(text(row.platform))
      ? text(row.platform)
      : 'unknown',
    createdAt: date(row.createdAt),
    updatedAt: date(row.updatedAt),
  }
}

export function validateProjectConnection(
  kind: 'source' | 'target',
  projectUrl: string,
  databaseUrl: string,
): void {
  const ref = kind === 'source' ? SOURCE_REF : TARGET_REF
  try {
    const api = new URL(projectUrl)
    const db = new URL(databaseUrl)
    if (
      api.origin !== `https://${ref}.supabase.co` ||
      api.pathname !== '/' ||
      api.search ||
      api.hash
    )
      throw new Error()
    if (!['postgres:', 'postgresql:'].includes(db.protocol)) throw new Error()
    const direct = db.hostname === `db.${ref}.supabase.co`
    const pooler =
      db.hostname.endsWith('.pooler.supabase.com') &&
      decodeURIComponent(db.username).endsWith(`.${ref}`)
    if (!direct && !pooler) throw new Error()
    const schema = db.searchParams.get('schema')
    if (schema && schema !== (kind === 'source' ? 'public' : TARGET_SCHEMA)) throw new Error()
    // Disallow server-side search_path overrides that could escape the dedicated schema.
    if (db.searchParams.has('options')) throw new Error()
  } catch {
    throw new Error(`${kind} connection does not identify the expected Supabase project/schema`)
  }
}

export function referencedAsset(iconUrl: string | null): Asset | null {
  if (!iconUrl) return null
  let url: URL
  try {
    url = new URL(iconUrl)
  } catch {
    return null
  }
  if (url.origin !== `https://${SOURCE_REF}.supabase.co`) return null
  const match = url.pathname.match(
    /^\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/]+)\/(.+)$/u,
  )
  if (!match || match[1] !== 'market-assets')
    throw new Error('A tool image references an unsupported source storage location')
  const objectKey = decodeURIComponent(match[2])
  if (objectKey.split('/').some((part) => !part || part === '.' || part === '..'))
    throw new Error('Invalid source image object key')
  const encoded = objectKey.split('/').map(encodeURIComponent).join('/')
  return {
    sourceUrl: iconUrl,
    objectKey,
    targetUrl: `https://${TARGET_REF}.supabase.co/storage/v1/object/public/${TARGET_BUCKET}/${encoded}`,
  }
}

export function snapshotHash(tools: MigratedTool[]): string {
  return sha256(JSON.stringify([...tools].sort((a, b) => a.id.localeCompare(b.id))))
}

// Reuse is an explicit migration baseline, not a claim that the new text template
// generated this vector. Keep the source hash/timestamp in the provenance report.
export function reusableSourceVector(
  source: Record<string, unknown>,
  target: MigratedTool,
  model: string,
) {
  const converted = convertTool(source)
  if (converted)
    converted.iconUrl = referencedAsset(converted.iconUrl)?.targetUrl ?? converted.iconUrl
  if (!converted || snapshotHash([converted]) !== snapshotHash([target]))
    throw new Error('Source vector does not belong to the migrated tool snapshot')
  if (source.embeddingModel !== model)
    throw new Error('Source vector model does not match the configured query model')
  const lists = ['tags', 'capabilities', 'recommendedFor'] as const
  if (
    ['name', 'description', 'category'].some((key) => typeof source[key] !== 'string') ||
    lists.some(
      (key) =>
        !Array.isArray(source[key]) || !source[key].every((item) => typeof item === 'string'),
    )
  )
    throw new Error('Source vector input metadata is incomplete')
  const content = [
    source.name,
    source.description,
    `分类: ${source.category}`,
    `标签: ${(source.tags as string[]).join('、')}`,
    `能力: ${(source.capabilities as string[]).join('、')}`,
    `适用于: ${(source.recommendedFor as string[]).join('、')}`,
  ].join('\n')
  const sourceContentHash = sha256(content)
  if (source.embeddingContentHash !== sourceContentHash)
    throw new Error('Source vector content hash is stale or missing')
  let vector: unknown
  try {
    vector = typeof source.embedding === 'string' ? JSON.parse(source.embedding) : source.embedding
  } catch {
    throw new Error('Source vector is invalid')
  }
  if (
    !Array.isArray(vector) ||
    vector.length !== 1024 ||
    !vector.every((v) => typeof v === 'number' && Number.isFinite(v)) ||
    !vector.some((v) => v !== 0)
  )
    throw new Error('Source vector must contain 1024 finite numbers with a nonzero norm')
  return {
    vector: vector as number[],
    model,
    sourceContentHash,
    embeddedAt: date(source.embeddedAt),
  }
}
