import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { resolve, dirname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse } from 'dotenv'
import pg from 'pg'
import { buildToolIndex } from '../src/shared/market/tool-index-content'
import {
  SOURCE_REF,
  TARGET_REF,
  TARGET_BUCKET,
  TARGET_SCHEMA,
  convertTool,
  referencedAsset,
  sha256,
  snapshotHash,
  validateProjectConnection,
  reusableSourceVector,
  type Asset,
  type MigratedTool,
} from './migration-model'

type Stage =
  | 'schema'
  | 'provision-runtime'
  | 'inspect'
  | 'export'
  | 'copy-assets'
  | 'import'
  | 'rebuild-index'
  | 'restore-vectors'
  | 'verify'
type Manifest = {
  version: 1
  sourceRef: string
  targetRef: string
  schema: string
  exportedAt: string
  totalSourceTools: number
  excludedTools: number
  contentHash: string
  tools: MigratedTool[]
  assets: Asset[]
}
type Config = {
  sourceUrl: string
  sourceDb: string
  sourceKey: string
  targetUrl: string
  targetDb: string
  targetKey: string
  authUserId: string
  model: string
  dimensions: number
  embeddingKey: string
  runtimePassword: string
}
type AuthUser = {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
  identities?: { provider: string }[]
  created_at?: string
}
const TOOL_COLUMNS = [
  'id',
  'name',
  'url',
  'description',
  'category',
  'tags',
  'iconUrl',
  'status',
  'pricingModel',
  'requiresAuth',
  'platform',
  'createdAt',
  'updatedAt',
] as const

async function optionalEnv(path: string): Promise<Record<string, string>> {
  try {
    return parse(await readFile(path))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw new Error('Could not read migration environment file')
  }
}
async function config(stage: Stage): Promise<Config> {
  const sourceEnv = await optionalEnv('.env')
  const targetEnv = await optionalEnv('.env.migration.local')
  const env = {
    ...sourceEnv,
    ...targetEnv,
    ...process.env,
  }
  const required = (name: string, fallback?: string): string => {
    const value = env[name]?.trim() || (fallback ? env[fallback]?.trim() : '')
    if (!value) throw new Error(`Missing migration setting: ${name}`)
    return value
  }
  const requiredSource = (name: string, fallback: string): string => {
    // A supplied target file may still contain unprefixed target credentials.
    // Only explicit SOURCE_* values can override the source-project settings.
    const value =
      process.env[name]?.trim() ||
      targetEnv[name]?.trim() ||
      sourceEnv[name]?.trim() ||
      process.env[fallback]?.trim() ||
      sourceEnv[fallback]?.trim()
    if (!value) throw new Error(`Missing migration setting: ${name}`)
    return value
  }
  const ddlOnly = stage === 'schema' || stage === 'provision-runtime'
  const result: Config = {
    sourceUrl: ddlOnly ? '' : requiredSource('SOURCE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'),
    sourceDb: ddlOnly ? '' : requiredSource('SOURCE_DATABASE_URL', 'DATABASE_URL'),
    sourceKey: ddlOnly ? '' : requiredSource('SOURCE_SUPABASE_SECRET_KEY', 'SUPABASE_SECRET_KEY'),
    targetUrl: required('TARGET_SUPABASE_URL'),
    targetDb: required('TARGET_DATABASE_URL'),
    targetKey: ddlOnly ? '' : required('TARGET_SUPABASE_SECRET_KEY'),
    authUserId: ddlOnly ? '' : required('TARGET_AUTH_USER_ID'),
    model: env.QWEN_EMBEDDING_MODEL?.trim() || 'text-embedding-v3',
    dimensions: Number(env.QWEN_EMBEDDING_DIMENSIONS || '1024'),
    embeddingKey: env.DASHSCOPE_API_KEY?.trim() || env.QWEN_API_KEY?.trim() || '',
    runtimePassword: env.TARGET_RUNTIME_DATABASE_PASSWORD || '',
  }
  if (!ddlOnly) validateProjectConnection('source', result.sourceUrl, result.sourceDb)
  validateProjectConnection('target', result.targetUrl, result.targetDb)
  if (!ddlOnly && !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/iu.test(result.authUserId))
    throw new Error('TARGET_AUTH_USER_ID must be a Supabase Auth UUID')
  if (result.dimensions !== 1024)
    throw new Error('Only 1024-dimensional embeddings fit the migrated ToolIndex')
  return result
}

function headers(key: string): Record<string, string> {
  return { apikey: key, ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}) }
}
export async function request(
  url: string,
  init: RequestInit = {},
  allow404 = false,
): Promise<Response> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(30_000),
        redirect: 'error',
      })
      if (response.ok || (allow404 && response.status === 404)) return response
      // Supabase Storage may carry its 404 inside an HTTP 400 JSON response.
      if (allow404 && response.status === 400) {
        const body = (await response
          .clone()
          .json()
          .catch(() => null)) as { statusCode?: string | number } | null
        if (String(body?.statusCode) === '404') return new Response(null, { status: 404 })
      }
      if (response.status !== 429 && response.status < 500)
        throw new Error(`Remote request rejected (${response.status})`)
      if (attempt === 2) throw new Error(`Remote service unavailable (${response.status})`)
    } catch (error) {
      if (
        attempt === 2 ||
        (error instanceof Error && error.message.startsWith('Remote request rejected'))
      )
        throw new Error('Migration remote request failed; credentials and payload were omitted')
    }
    await new Promise((done) => setTimeout(done, 500 * 2 ** attempt))
  }
  throw new Error('Remote request failed')
}
async function database(connection: string, readOnly: boolean): Promise<pg.Client> {
  const url = new URL(connection)
  url.searchParams.delete('schema')
  const client = new pg.Client({
    connectionString: url.toString(),
    connectionTimeoutMillis: 15_000,
    statement_timeout: 120_000,
    types: {
      getTypeParser: (oid, format) => {
        // Prisma timestamps are UTC without a database timezone. pg otherwise
        // interprets them in the operator's local timezone, breaking repeat imports.
        if (oid === 1114 && format !== 'binary')
          return (value: string) => new Date(`${value.replace(' ', 'T')}Z`)
        return pg.types.getTypeParser(oid, format)
      },
    },
  })
  try {
    await client.connect()
    await client.query(`SET default_transaction_read_only = ${readOnly ? 'on' : 'off'}`)
    await client.query('SET search_path = pg_catalog')
    return client
  } catch {
    await client.end().catch(() => {})
    throw new Error('Database connection failed; connection details were omitted')
  }
}
async function owner(cfg: Config): Promise<AuthUser> {
  const response = await request(`${cfg.targetUrl}/auth/v1/admin/users/${cfg.authUserId}`, {
    headers: headers(cfg.targetKey),
  })
  const body = (await response.json()) as AuthUser | { user: AuthUser }
  const user = 'user' in body ? body.user : body
  const providers = user.app_metadata?.providers
  if (
    user.id !== cfg.authUserId ||
    !(
      user.identities?.some((item) => item.provider === 'github') ||
      user.app_metadata?.provider === 'github' ||
      (Array.isArray(providers) && providers.includes('github'))
    )
  )
    throw new Error('The specified target Auth user does not have a verified GitHub identity')
  return user
}
async function assertTarget(client: pg.Client): Promise<void> {
  const result = await client.query<{ tool: string | null; index: string | null }>(
    `SELECT to_regclass('dorapocket."Tool"')::text AS tool, to_regclass('dorapocket."ToolIndex"')::text AS index`,
  )
  if (!result.rows[0]?.tool || !result.rows[0]?.index)
    throw new Error('Target schema is missing; deploy the isolated Prisma baseline first')
  const role = await client.query(`SELECT 1 FROM pg_roles WHERE rolname = 'dorapocket_app'`)
  if (!role.rowCount) throw new Error('Target runtime role dorapocket_app is missing')
}
async function vectorNamespace(client: pg.Client): Promise<string> {
  const result = await client.query<{ namespace: string }>(
    `SELECT n.nspname AS namespace FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='vector'`,
  )
  const namespace = result.rows[0]?.namespace
  if (!namespace || !/^[a-z_][a-z_0-9]*$/u.test(namespace))
    throw new Error('Target vector extension namespace is missing or unsupported')
  return `"${namespace}"`
}

async function schema(cfg: Config, apply: boolean): Promise<void> {
  const client = await database(cfg.targetDb, true)
  try {
    const tables = await client.query<{ name: string }>(
      `SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='dorapocket' AND c.relkind IN ('r','p','v','m','S')`,
    )
    if (tables.rowCount) {
      if (!tables.rows.some((row) => row.name === '_prisma_migrations'))
        throw new Error(
          'Target dorapocket schema is non-empty without the dedicated migration history',
        )
      const migrations = await client.query<{
        migration_name: string
        checksum: string
        finished_at: Date | null
        rolled_back_at: Date | null
      }>(
        `SELECT migration_name, checksum, finished_at, rolled_back_at FROM dorapocket."_prisma_migrations"`,
      )
      const expectedChecksum = sha256(
        await readFile('prisma/migrations-dorapocket/20261015000000_baseline/migration.sql'),
      )
      if (
        (!migrations.rowCount && tables.rows.some((row) => row.name !== '_prisma_migrations')) ||
        migrations.rows.some(
          (row) =>
            row.migration_name !== '20261015000000_baseline' ||
            row.checksum !== expectedChecksum ||
            (!row.finished_at && !row.rolled_back_at),
        )
      )
        throw new Error(
          'Target migration history is unknown or contains a failed migration; resolve it before deploying',
        )
    }
  } finally {
    await client.end()
  }
  if (apply) {
    const migrationUrl = new URL(cfg.targetDb)
    migrationUrl.searchParams.set('schema', TARGET_SCHEMA)
    await new Promise<void>((done, reject) => {
      const child = spawn(
        process.execPath,
        ['node_modules/prisma/build/index.js', 'migrate', 'deploy', '--config', 'prisma.config.ts'],
        {
          env: { ...process.env, MIGRATION_DATABASE_URL: migrationUrl.toString() },
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        },
      )
      // Drain diagnostics without echoing environment-derived connection details.
      child.stdout.resume()
      child.stderr.resume()
      child.once('error', () => reject(new Error('Could not launch Prisma migrate deploy')))
      child.once('close', (code) =>
        code === 0
          ? done()
          : reject(
              new Error(
                'Dedicated Prisma baseline deployment failed; inspect target permissions and migration state',
              ),
            ),
      )
    })
  }
  console.log(
    JSON.stringify({
      stage: 'schema',
      apply,
      schema: TARGET_SCHEMA,
      command: 'prisma migrate deploy',
      migrationHistory: 'dorapocket._prisma_migrations',
    }),
  )
}
async function provisionRuntime(cfg: Config, apply: boolean): Promise<void> {
  const client = await database(cfg.targetDb, !apply)
  try {
    await assertTarget(client)
    if (apply) {
      if (cfg.runtimePassword.length < 24)
        throw new Error(
          'Set TARGET_RUNTIME_DATABASE_PASSWORD to a strong password of at least 24 characters',
        )
      const url = new URL(cfg.targetDb)
      url.username = url.hostname.endsWith('.pooler.supabase.com')
        ? `dorapocket_app.${TARGET_REF}`
        : 'dorapocket_app'
      url.password = cfg.runtimePassword
      url.searchParams.set('schema', TARGET_SCHEMA)
      // Ship the public provider CA with the app, rather than an operator-specific absolute path.
      if (url.searchParams.has('sslrootcert'))
        url.searchParams.set('sslrootcert', 'prisma/supabase-ca.crt')
      const runtimeConfig = `DATABASE_URL=${JSON.stringify(url.toString())}\n`
      let existingConfig: string | null = null
      try {
        existingConfig = await readFile('tmp/dorapocket-runtime.env', 'utf8')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
          throw new Error('Could not inspect runtime config artifact')
      }
      if (existingConfig !== null && existingConfig !== runtimeConfig)
        throw new Error(
          'Runtime config artifact already exists with different credentials; no role changes were made',
        )
      await client.query('BEGIN')
      const statement = await client.query<{ sql: string }>(
        `SELECT format('ALTER ROLE dorapocket_app LOGIN PASSWORD %L', $1::text) AS sql`,
        [cfg.runtimePassword],
      )
      await client.query(statement.rows[0].sql)
      const grant = await client.query<{ sql: string }>(
        `SELECT format('GRANT CONNECT ON DATABASE %I TO dorapocket_app', current_database()) AS sql`,
      )
      await client.query(grant.rows[0].sql)
      await mkdir('tmp', { recursive: true })
      if (existingConfig === null)
        await writeFile('tmp/dorapocket-runtime.env', runtimeConfig, { mode: 0o600, flag: 'wx' })
      await client.query('COMMIT')
    }
    console.log(
      JSON.stringify({
        stage: 'provision-runtime',
        apply,
        role: 'dorapocket_app',
        runtimeConfigWritten: apply,
        runtimeConfig: apply ? 'tmp/dorapocket-runtime.env' : null,
      }),
    )
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    await client.end()
  }
}
async function sourceCatalog(
  cfg: Config,
  includeSnapshot = false,
): Promise<{
  tools: MigratedTool[]
  total: number
  assets: Asset[]
  sourceRows?: Record<string, unknown>[]
}> {
  const source = await database(cfg.sourceDb, true)
  try {
    const rows = await source.query<{ row: Record<string, unknown> }>(
      `SELECT ${includeSnapshot ? 'to_jsonb(t)' : "to_jsonb(t) - 'embedding' - 'searchDocument'"} AS row FROM public."Tool" t ORDER BY t.id`,
    )
    const tools = rows.rows
      .map(({ row }) => convertTool(row))
      .filter((tool): tool is MigratedTool => tool !== null)
    const assets = new Map<string, Asset>()
    for (const tool of tools) {
      const asset = referencedAsset(tool.iconUrl)
      if (asset) {
        assets.set(asset.sourceUrl, asset)
        tool.iconUrl = asset.targetUrl
      }
    }
    return {
      tools,
      total: rows.rows.length,
      assets: [...assets.values()],
      ...(includeSnapshot ? { sourceRows: rows.rows.map(({ row }) => row) } : {}),
    }
  } finally {
    await source.end()
  }
}
function objectPath(asset: Asset): string {
  return asset.objectKey.split('/').map(encodeURIComponent).join('/')
}
async function sourceImage(
  cfg: Config,
  asset: Asset,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const result = await request(
    `${cfg.sourceUrl}/storage/v1/object/authenticated/market-assets/${objectPath(asset)}`,
    { headers: headers(cfg.sourceKey) },
  )
  return {
    bytes: new Uint8Array(await result.arrayBuffer()),
    contentType: result.headers.get('content-type') || 'application/octet-stream',
  }
}
async function targetImageHash(cfg: Config, asset: Asset): Promise<string | null> {
  const response = await request(
    `${cfg.targetUrl}/storage/v1/object/authenticated/${TARGET_BUCKET}/${objectPath(asset)}`,
    { headers: headers(cfg.targetKey) },
    true,
  )
  return response.status === 404 ? null : sha256(new Uint8Array(await response.arrayBuffer()))
}
async function readManifest(path: string): Promise<Manifest> {
  const manifest = JSON.parse(await readFile(path, 'utf8')) as Manifest
  if (
    manifest.version !== 1 ||
    manifest.sourceRef !== SOURCE_REF ||
    manifest.targetRef !== TARGET_REF ||
    manifest.schema !== TARGET_SCHEMA ||
    !Array.isArray(manifest.tools) ||
    !Array.isArray(manifest.assets)
  )
    throw new Error('Migration artifact does not match this source/target/schema')
  if (
    snapshotHash(manifest.tools) !== manifest.contentHash ||
    new Set(manifest.tools.map((tool) => tool.id)).size !== manifest.tools.length
  )
    throw new Error('Migration artifact content hash/IDs are invalid')
  for (const tool of manifest.tools) {
    const converted = convertTool(tool)
    if (
      Object.keys(tool).sort().join() !== [...TOOL_COLUMNS].sort().join() ||
      !converted ||
      TOOL_COLUMNS.some(
        (column) => JSON.stringify(converted[column]) !== JSON.stringify(tool[column]),
      ) ||
      !['active', 'inactive'].includes(tool.status)
    )
      throw new Error('Migration artifact contains an invalid tool')
  }
  for (const asset of manifest.assets) {
    const expected = referencedAsset(asset.sourceUrl)
    if (
      !expected ||
      expected.targetUrl !== asset.targetUrl ||
      expected.objectKey !== asset.objectKey ||
      !/^[a-f\d]{64}$/u.test(asset.sha256 || '')
    )
      throw new Error('Migration artifact contains an invalid image mapping/hash')
  }
  const prefix = `https://${TARGET_REF}.supabase.co/storage/v1/object/public/${TARGET_BUCKET}/`
  if (
    manifest.tools.some(
      (tool) =>
        tool.iconUrl?.startsWith(prefix) &&
        !manifest.assets.some((asset) => asset.targetUrl === tool.iconUrl),
    )
  )
    throw new Error('A target image has no source asset mapping')
  return manifest
}
async function ensureBuckets(cfg: Config, apply: boolean, requireExisting = false): Promise<void> {
  for (const bucket of [TARGET_BUCKET, 'dorapocket-avatars']) {
    const response = await request(
      `${cfg.targetUrl}/storage/v1/bucket/${bucket}`,
      { headers: headers(cfg.targetKey) },
      true,
    )
    if (response.status === 404) {
      if (requireExisting) throw new Error('Target storage buckets have not been created')
      if (apply)
        await request(`${cfg.targetUrl}/storage/v1/bucket`, {
          method: 'POST',
          headers: { ...headers(cfg.targetKey), 'content-type': 'application/json' },
          body: JSON.stringify({ id: bucket, name: bucket, public: true }),
        })
    } else {
      const body = (await response.json()) as { public?: boolean }
      if (!body.public)
        throw new Error(
          'Existing target asset bucket is private; resolve the bucket configuration before copying',
        )
    }
    if (bucket === 'dorapocket-avatars' && (response.status !== 404 || apply)) {
      const listing = await request(`${cfg.targetUrl}/storage/v1/object/list/${bucket}`, {
        method: 'POST',
        headers: { ...headers(cfg.targetKey), 'content-type': 'application/json' },
        body: JSON.stringify({ prefix: '', limit: 1, offset: 0 }),
      })
      const objects = (await listing.json()) as unknown[]
      if (!Array.isArray(objects) || objects.length)
        throw new Error(
          'Target avatar bucket is not empty; resolve the migration destination before cutover',
        )
    }
  }
}
async function copyAssets(cfg: Config, manifest: Manifest, apply: boolean): Promise<void> {
  await ensureBuckets(cfg, apply)
  let copied = 0
  for (const asset of manifest.assets) {
    const source = await sourceImage(cfg, asset)
    if (sha256(source.bytes) !== asset.sha256)
      throw new Error('Source image changed after export; export a fresh maintenance snapshot')
    const existingHash = await targetImageHash(cfg, asset)
    if (existingHash && existingHash !== asset.sha256)
      throw new Error('Target image conflict; no existing object was overwritten')
    if (!existingHash && apply) {
      await request(`${cfg.targetUrl}/storage/v1/object/${TARGET_BUCKET}/${objectPath(asset)}`, {
        method: 'POST',
        headers: {
          ...headers(cfg.targetKey),
          'content-type': source.contentType,
          'x-upsert': 'false',
        },
        body: Buffer.from(source.bytes),
      })
      if ((await targetImageHash(cfg, asset)) !== asset.sha256)
        throw new Error('Copied image hash verification failed')
      copied++
    }
  }
  console.log(
    JSON.stringify({
      stage: 'copy-assets',
      apply,
      referencedImages: manifest.assets.length,
      copied,
    }),
  )
}

export function toolMatches(
  row: Record<string, unknown>,
  tool: MigratedTool,
  businessUserId: string,
): boolean {
  if (row.createdByUserId !== businessUserId) return false
  return TOOL_COLUMNS.every((column) => {
    const value = row[column]
    const canonical = value instanceof Date ? value.toISOString() : value
    return JSON.stringify(canonical) === JSON.stringify(tool[column])
  })
}
export function embeddingFenceTimestamp(value: Date | string): string {
  // Pass a string to pg: its default Date serializer uses the local timezone,
  // while Tool.updatedAt is a UTC timestamp without timezone.
  return value instanceof Date ? value.toISOString() : value
}
async function preflight(
  client: pg.Client,
  tools: MigratedTool[],
  businessUserId: string,
): Promise<MigratedTool[]> {
  const existing = await client.query(
    `SELECT ${TOOL_COLUMNS.map((field) => `"${field}"`).join(', ')}, "createdByUserId" FROM dorapocket."Tool" WHERE id = ANY($1::text[])`,
    [tools.map((tool) => tool.id)],
  )
  const byId = new Map(existing.rows.map((row: Record<string, unknown>) => [row.id, row]))
  for (const tool of tools) {
    const row = byId.get(tool.id)
    if (row && !toolMatches(row, tool, businessUserId))
      throw new Error('Existing target tool conflicts with the snapshot; no tools were changed')
  }
  return tools.filter((tool) => !byId.has(tool.id))
}
async function importTools(cfg: Config, manifest: Manifest, apply: boolean): Promise<void> {
  const authUser = await owner(cfg)
  await ensureBuckets(cfg, false, true)
  const current = await sourceCatalog(cfg)
  if (snapshotHash(current.tools) !== manifest.contentHash)
    throw new Error('Source catalog changed after export; enable maintenance and export again')
  for (const asset of manifest.assets)
    if ((await targetImageHash(cfg, asset)) !== asset.sha256)
      throw new Error('A referenced image has not been copied and verified')
  const client = await database(cfg.targetDb, !apply)
  try {
    await assertTarget(client)
    await client.query('BEGIN')
    if (apply)
      await client.query(`SELECT pg_advisory_xact_lock(hashtext('dorapocket-catalog-migration'))`)
    const existingUser = await client.query<{ id: string }>(
      `SELECT id FROM dorapocket."User" WHERE "supabaseUserId" = $1`,
      [cfg.authUserId],
    )
    const businessUserId =
      existingUser.rows[0]?.id || `migration_${sha256(cfg.authUserId).slice(0, 24)}`
    const pending = await preflight(client, manifest.tools, businessUserId)
    if (apply) {
      if (!existingUser.rowCount) {
        const meta = authUser.user_metadata || {}
        const nickname =
          [meta.full_name, meta.user_name, meta.preferred_username, meta.name].find(
            (value) => typeof value === 'string' && value.trim(),
          ) || 'GitHub user'
        await client.query(
          `INSERT INTO dorapocket."User" (id, "supabaseUserId", email, nickname, "authProvider", "authCreatedAt", "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,'github',$5,now(),now())`,
          [
            businessUserId,
            cfg.authUserId,
            authUser.email || null,
            nickname,
            authUser.created_at || null,
          ],
        )
      }
      for (const tool of pending) {
        const columns = [...TOOL_COLUMNS, 'createdByUserId']
        await client.query(
          `INSERT INTO dorapocket."Tool" (${columns.map((field) => `"${field}"`).join(', ')}) VALUES (${columns.map((_, index) => `$${index + 1}`).join(', ')})`,
          [...TOOL_COLUMNS.map((field) => tool[field]), businessUserId],
        )
        const index = buildToolIndex(tool, { model: cfg.model, dimensions: cfg.dimensions })
        await client.query(
          `INSERT INTO dorapocket."ToolIndex" ("toolId", content, "contentHash") VALUES ($1,$2,$3)`,
          [tool.id, index.content, index.contentHash],
        )
      }
    }
    await client.query(apply ? 'COMMIT' : 'ROLLBACK')
    console.log(
      JSON.stringify({
        stage: 'import',
        apply,
        tools: manifest.tools.length,
        pending: pending.length,
        skipped: manifest.tools.length - pending.length,
        owner: 'verified-target-github-user',
      }),
    )
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    await client.end()
  }
}

async function embed(cfg: Config, content: string): Promise<number[]> {
  if (!cfg.embeddingKey)
    throw new Error('DASHSCOPE_API_KEY or QWEN_API_KEY is required to rebuild embeddings')
  const response = await request('https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings', {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.embeddingKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      input: content,
      dimensions: cfg.dimensions,
      encoding_format: 'float',
    }),
  })
  const body = (await response.json()) as { data?: { embedding?: number[] }[] }
  const vector = body.data?.[0]?.embedding
  if (!Array.isArray(vector) || vector.length !== 1024 || !vector.every(Number.isFinite))
    throw new Error('Embedding provider returned an invalid vector')
  return vector
}

async function restoreVectors(cfg: Config, manifest: Manifest, artifact: string, apply: boolean) {
  const backup = JSON.parse(await readFile(`${artifact}.source-tools.json`, 'utf8')) as {
    sourceRef: string
    exportedAt: string
    rows: Record<string, unknown>[]
  }
  if (
    backup.sourceRef !== SOURCE_REF ||
    backup.exportedAt !== manifest.exportedAt ||
    !Array.isArray(backup.rows)
  )
    throw new Error('Vector backup does not match the tool snapshot')
  const sources = new Map(backup.rows.map((row) => [row.id, row]))
  if (sources.size !== backup.rows.length)
    throw new Error('Vector backup contains duplicate tool IDs')
  const plans = manifest.tools.map((tool) => {
    const source = sources.get(tool.id)
    if (!source) throw new Error('Vector backup is missing a migrated tool')
    return {
      tool,
      index: buildToolIndex(tool, { model: cfg.model, dimensions: cfg.dimensions }),
      original: reusableSourceVector(source, tool, cfg.model),
    }
  })
  const provenance =
    JSON.stringify(
      {
        version: 1,
        sourceRef: SOURCE_REF,
        targetRef: TARGET_REF,
        snapshotContentHash: manifest.contentHash,
        strategy: 'reuse-legacy-input-vectors',
        vectors: plans.map(({ tool, index, original }) => ({
          toolId: tool.id,
          sourceContentHash: original.sourceContentHash,
          acceptedTargetContentHash: index.contentHash,
          model: original.model,
          embeddedAt: original.embeddedAt,
          vectorHash: sha256(JSON.stringify(original.vector)),
        })),
      },
      null,
      2,
    ) + '\n'
  const reportPath = `${artifact}.vector-reuse.json`
  let existingReport: string | undefined
  try {
    existingReport = await readFile(reportPath, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  if (existingReport !== undefined && existingReport !== provenance)
    throw new Error('Existing vector provenance report conflicts with this snapshot')
  await owner(cfg)
  const client = await database(cfg.targetDb, !apply)
  let restored = 0
  let skipped = 0
  try {
    await assertTarget(client)
    const vectorSchema = await vectorNamespace(client)
    await client.query('BEGIN')
    if (apply)
      await client.query(`SELECT pg_advisory_xact_lock(hashtext('dorapocket-catalog-migration'))`)
    const users = await client.query<{ id: string }>(
      `SELECT id FROM dorapocket."User" WHERE "supabaseUserId"=$1`,
      [cfg.authUserId],
    )
    const userId = users.rows[0]?.id
    if (!userId || (await preflight(client, manifest.tools, userId)).length)
      throw new Error('Import the unchanged tool snapshot before restoring vectors')
    const rows = await client.query(
      `SELECT "toolId", content, "contentHash", embedding::text AS vector, "embeddingModel", "embeddedAt" FROM dorapocket."ToolIndex" WHERE "toolId"=ANY($1::text[])`,
      [manifest.tools.map((tool) => tool.id)],
    )
    const indexes = new Map(rows.rows.map((row) => [row.toolId, row]))
    for (const { tool, index, original } of plans) {
      const row = indexes.get(tool.id)
      if (!row || row.content !== index.content || row.contentHash !== index.contentHash)
        throw new Error('Target index changed after import; vector restore stopped')
      if (row.vector !== null) {
        if (
          row.embeddingModel !== original.model ||
          JSON.stringify(JSON.parse(row.vector)) !== JSON.stringify(original.vector) ||
          row.embeddedAt?.toISOString() !== original.embeddedAt
        )
          throw new Error('Existing target vector conflicts with the source snapshot')
        skipped++
        continue
      }
      if (!apply) continue
      const updated = await client.query(
        `UPDATE dorapocket."ToolIndex" i SET embedding=$1::${vectorSchema}.vector, "embeddingModel"=$2, "embeddedAt"=$3 FROM dorapocket."Tool" t WHERE i."toolId"=$4 AND i."contentHash"=$5 AND i.embedding IS NULL AND t.id=i."toolId" AND t."updatedAt"=$6 AND t."createdByUserId"=$7`,
        [
          JSON.stringify(original.vector),
          original.model,
          original.embeddedAt,
          tool.id,
          index.contentHash,
          tool.updatedAt,
          userId,
        ],
      )
      if (updated.rowCount !== 1)
        throw new Error('Tool changed during vector restore; transaction rolled back')
      restored++
    }
    await client.query(apply ? 'COMMIT' : 'ROLLBACK')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    await client.end()
  }
  if (apply && existingReport === undefined)
    await writeFile(reportPath, provenance, { encoding: 'utf8', flag: 'wx', mode: 0o600 })
  console.log(
    JSON.stringify({
      stage: 'restore-vectors',
      apply,
      tools: plans.length,
      pending: plans.length - skipped,
      restored,
      skipped,
      providerCalls: 0,
      provenanceWritten: apply,
      model: cfg.model,
      dimensions: 1024,
    }),
  )
}
async function rebuild(cfg: Config, manifest: Manifest, apply: boolean): Promise<void> {
  const client = await database(cfg.targetDb, !apply)
  try {
    await assertTarget(client)
    const vectorSchema = await vectorNamespace(client)
    const rows = await client.query(
      `SELECT ${TOOL_COLUMNS.map((field) => `t."${field}"`).join(', ')}, i."contentHash" AS "indexHash", i."embeddingModel", i.embedding IS NOT NULL AS "hasEmbedding" FROM dorapocket."Tool" t LEFT JOIN dorapocket."ToolIndex" i ON i."toolId" = t.id WHERE t.id = ANY($1::text[]) ORDER BY t.id`,
      [manifest.tools.map((tool) => tool.id)],
    )
    if (rows.rowCount !== manifest.tools.length)
      throw new Error('Import all snapshot tools before rebuilding the index')
    let rebuilt = 0
    let pending = 0
    for (const row of rows.rows) {
      const index = buildToolIndex(row, { model: cfg.model, dimensions: cfg.dimensions })
      if (
        row.indexHash === index.contentHash &&
        row.hasEmbedding &&
        row.embeddingModel === cfg.model
      )
        continue
      pending++
      if (!apply) continue
      // First invalidate changed content, then compare the hash again when the remote call returns.
      await client.query(
        `INSERT INTO dorapocket."ToolIndex" ("toolId", content, "contentHash") VALUES ($1,$2,$3) ON CONFLICT ("toolId") DO UPDATE SET content=EXCLUDED.content, "contentHash"=EXCLUDED."contentHash", embedding=NULL, "embeddingModel"=NULL, "embeddedAt"=NULL WHERE dorapocket."ToolIndex"."contentHash" <> EXCLUDED."contentHash"`,
        [row.id, index.content, index.contentHash],
      )
      const vector = await embed(cfg, index.content)
      const updated = await client.query(
        `UPDATE dorapocket."ToolIndex" i SET embedding=$1::${vectorSchema}.vector, "embeddingModel"=$2, "embeddedAt"=now() FROM dorapocket."Tool" t WHERE i."toolId"=$3 AND i."contentHash"=$4 AND t.id=i."toolId" AND t."updatedAt"=$5`,
        [
          JSON.stringify(vector),
          cfg.model,
          row.id,
          index.contentHash,
          embeddingFenceTimestamp(row.updatedAt),
        ],
      )
      if (updated.rowCount !== 1)
        throw new Error('Tool changed while embedding was generated; rerun rebuild-index')
      rebuilt++
    }
    console.log(
      JSON.stringify({
        stage: 'rebuild-index',
        apply,
        tools: rows.rowCount,
        pending,
        rebuilt,
        model: cfg.model,
        dimensions: cfg.dimensions,
      }),
    )
  } finally {
    await client.end()
  }
}
async function verify(cfg: Config, manifest: Manifest): Promise<void> {
  await owner(cfg)
  const source = await sourceCatalog(cfg)
  if (snapshotHash(source.tools) !== manifest.contentHash)
    throw new Error(
      'Source catalog changed after export; keep maintenance enabled and reconcile before cutover',
    )
  await ensureBuckets(cfg, false, true)
  const client = await database(cfg.targetDb, true)
  try {
    await assertTarget(client)
    const vectorSchema = await vectorNamespace(client)
    const users = await client.query<{ id: string }>(
      `SELECT id FROM dorapocket."User" WHERE "supabaseUserId"=$1`,
      [cfg.authUserId],
    )
    if (!users.rows[0]) throw new Error('Migration owner business user is missing')
    const pending = await preflight(client, manifest.tools, users.rows[0].id)
    if (pending.length) throw new Error('Target is missing tools from the snapshot')
    const rows = await client.query(
      `SELECT t.id, t.name, t.description, t.category, t.tags, i.content, i."contentHash", i."embeddingModel", i."embeddedAt", ${vectorSchema}.vector_dims(i.embedding) AS dimensions, i."searchDocument" IS NOT NULL AS "hasSearch" FROM dorapocket."Tool" t LEFT JOIN dorapocket."ToolIndex" i ON i."toolId"=t.id WHERE t.id=ANY($1::text[])`,
      [manifest.tools.map((tool) => tool.id)],
    )
    for (const row of rows.rows) {
      const expected = buildToolIndex(row, { model: cfg.model, dimensions: cfg.dimensions })
      if (
        row.content !== expected.content ||
        row.contentHash !== expected.contentHash ||
        row.embeddingModel !== cfg.model ||
        row.dimensions !== 1024 ||
        !row.embeddedAt ||
        !row.hasSearch
      )
        throw new Error('Target search/vector index is incomplete or stale')
    }
    for (const asset of manifest.assets)
      if ((await targetImageHash(cfg, asset)) !== asset.sha256)
        throw new Error('Target image verification failed')
    console.log(
      JSON.stringify({
        stage: 'verify',
        verified: true,
        tools: manifest.tools.length,
        excludedSourceResources: manifest.excludedTools,
        images: manifest.assets.length,
        model: cfg.model,
        dimensions: 1024,
        owner: 'verified-target-github-user',
      }),
    )
  } finally {
    await client.end()
  }
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  const stage = args[0] as Stage
  if (
    ![
      'schema',
      'provision-runtime',
      'inspect',
      'export',
      'copy-assets',
      'import',
      'rebuild-index',
      'restore-vectors',
      'verify',
    ].includes(stage)
  )
    throw new Error(
      'Usage: migrate-dorapocket <schema|provision-runtime|inspect|export|copy-assets|import|restore-vectors|rebuild-index|verify> [--apply] [--artifact tmp/dorapocket-migration.json]',
    )
  const apply = args.includes('--apply')
  const artifactIndex = args.indexOf('--artifact')
  const artifact = resolve(
    artifactIndex >= 0 ? args[artifactIndex + 1] || '' : 'tmp/dorapocket-migration.json',
  )
  const allowedArgs = new Set([
    stage,
    '--apply',
    '--artifact',
    ...(artifactIndex >= 0 ? [args[artifactIndex + 1]] : []),
  ])
  if (args.some((arg) => !allowedArgs.has(arg)) || (artifactIndex >= 0 && !args[artifactIndex + 1]))
    throw new Error('Unknown or incomplete migration option')
  if (!artifact.toLowerCase().startsWith(`${resolve('tmp')}${sep}`.toLowerCase()))
    throw new Error('Migration artifacts must remain in the ignored tmp directory')
  const cfg = await config(stage)
  if (stage === 'schema') {
    await schema(cfg, apply)
    return
  }
  if (stage === 'provision-runtime') {
    await provisionRuntime(cfg, apply)
    return
  }
  if (stage === 'inspect' || stage === 'export') {
    await owner(cfg)
    const catalog = await sourceCatalog(cfg, stage === 'export' && apply)
    if (stage === 'export' && apply) {
      for (const asset of catalog.assets)
        asset.sha256 = sha256((await sourceImage(cfg, asset)).bytes)
      const manifest: Manifest = {
        version: 1,
        sourceRef: SOURCE_REF,
        targetRef: TARGET_REF,
        schema: TARGET_SCHEMA,
        exportedAt: new Date().toISOString(),
        totalSourceTools: catalog.total,
        excludedTools: catalog.total - catalog.tools.length,
        tools: catalog.tools,
        assets: catalog.assets,
        contentHash: snapshotHash(catalog.tools),
      }
      await mkdir(dirname(artifact), { recursive: true })
      await writeFile(
        `${artifact}.source-tools.json`,
        JSON.stringify(
          { sourceRef: SOURCE_REF, exportedAt: manifest.exportedAt, rows: catalog.sourceRows },
          null,
          2,
        ) + '\n',
        { encoding: 'utf8', flag: 'wx', mode: 0o600 },
      )
      await writeFile(artifact, JSON.stringify(manifest, null, 2) + '\n', {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      })
    }
    console.log(
      JSON.stringify({
        stage,
        apply,
        sourceTools: catalog.total,
        migratableTools: catalog.tools.length,
        excludedResources: catalog.total - catalog.tools.length,
        referencedImages: catalog.assets.length,
        contentHash: snapshotHash(catalog.tools),
        artifactWritten: stage === 'export' && apply,
      }),
    )
    return
  }
  const manifest = await readManifest(artifact)
  if (stage === 'copy-assets') await copyAssets(cfg, manifest, apply)
  if (stage === 'import') await importTools(cfg, manifest, apply)
  if (stage === 'rebuild-index') await rebuild(cfg, manifest, apply)
  if (stage === 'restore-vectors') await restoreVectors(cfg, manifest, artifact, apply)
  if (stage === 'verify') await verify(cfg, manifest)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    // Never echo provider/database error payloads: they may contain credentials or connection URLs.
    const safe =
      error instanceof Error && error.constructor === Error && !('code' in error)
        ? error.message
        : 'Migration failed; inspect project connectivity and permissions without logging credentials'
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
    const diagnostic = /^[A-Z\d]{5}$/u.test(code) ? ` (database code ${code})` : ''
    console.error(
      safe.replace(/(?:postgres(?:ql)?:\/\/|https?:\/\/)[^\s]+/giu, '[redacted URL]') + diagnostic,
    )
    process.exitCode = 1
  })
}
