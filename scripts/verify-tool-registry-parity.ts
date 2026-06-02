import 'dotenv/config'

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { BUILTIN_TOOL_REGISTRY } from '../src/shared/tool-registry'
import type { ToolItem } from '../src/shared/tool-registry'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const snapshotPath = join(
  dirname(fileURLToPath(import.meta.url)),
  'data/market-catalog-snapshot.json',
)

function loadExpectedMarketIds(): Set<string> {
  const raw = readFileSync(snapshotPath, 'utf8')
  const tools = JSON.parse(raw) as ToolItem[]
  return new Set(tools.map((tool) => tool.id))
}

async function main() {
  const builtinIds = new Set(BUILTIN_TOOL_REGISTRY.map((tool) => tool.id))
  const expectedMarketIds = loadExpectedMarketIds()

  const dbTools = await prisma.tool.findMany({
    where: { status: 'active' },
    select: { id: true },
  })
  const dbIds = new Set(dbTools.map((tool) => tool.id))

  const missingMarket = [...expectedMarketIds].filter((id) => !dbIds.has(id))
  const missingBuiltin = [...builtinIds].filter((id) => !dbIds.has(id))

  console.log(`Expected market ids: ${expectedMarketIds.size}`)
  console.log(`Builtin ids (code): ${builtinIds.size}`)
  console.log(`DB active ids: ${dbIds.size}`)
  console.log(`Market missing in DB: ${missingMarket.length}`)
  console.log(`Builtin missing in DB: ${missingBuiltin.length}`)

  if (missingMarket.length > 0) {
    console.log(missingMarket.slice(0, 20).join('\n'))
    process.exit(1)
  }
}

await main()
await prisma.$disconnect()
