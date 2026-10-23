import 'dotenv/config'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../src/server/db/prisma'
import { syncToolArtifacts } from '../src/server/market/sync-tool-artifacts'

type RetryDeps = {
  env: Record<string, string | undefined>
  findTool: (toolId: string) => Promise<{ id: string; status: string } | null>
  syncArtifacts: (toolId: string) => Promise<{ embeddingSynced: boolean; faviconSynced: boolean }>
}

const requiredConfig = [
  'DATABASE_URL',
  'QWEN_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
] as const

export async function retryToolSync(
  args: string[],
  deps: Partial<RetryDeps> = {},
): Promise<{ toolId: string; embeddingSynced: boolean; faviconSynced: boolean }> {
  if (args.length !== 2 || args[0] !== '--tool-id' || !args[1]?.trim()) {
    throw new Error('Usage: yarn retry:tool-sync --tool-id <tool-id>')
  }
  const toolId = args[1].trim()
  const env = deps.env ?? process.env
  for (const name of requiredConfig) {
    if (!env[name]?.trim()) throw new Error(name + ' is required')
  }

  const findTool =
    deps.findTool ??
    ((id: string) =>
      prisma.tool.findUnique({
        where: { id },
        select: { id: true, status: true },
      }))
  const tool = await findTool(toolId)
  if (!tool) throw new Error('Tool ' + toolId + ' not found')
  if (tool.status !== 'active') throw new Error('Tool ' + toolId + ' is not active')

  const result = await (deps.syncArtifacts ?? syncToolArtifacts)(toolId)
  return { toolId, ...result }
}

export async function runCli(
  args: string[],
  deps: Partial<RetryDeps> = {},
  log: { info: (message: string) => void; error: (message: string) => void } = console,
): Promise<number> {
  try {
    log.info(JSON.stringify(await retryToolSync(args, deps)))
    return 0
  } catch (error) {
    log.error('[retry-tool-sync] ' + (error instanceof Error ? error.message : String(error)))
    return 1
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runCli(process.argv.slice(2))
}
