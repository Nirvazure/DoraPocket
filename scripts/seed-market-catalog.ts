import 'dotenv/config'

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaPg } from '@prisma/adapter-pg'
import type * as Prisma from '../src/generated/prisma/internal/prismaNamespace'
import { PrismaClient } from '../src/generated/prisma/client'
import type { ToolItem } from '../src/shared/tool-registry'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed market catalog')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const snapshotPath = join(
  dirname(fileURLToPath(import.meta.url)),
  'data/market-catalog-snapshot.json',
)

function toJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value == null) return undefined
  return value as Prisma.InputJsonValue
}

function withoutIconFields<T extends Record<string, unknown>>(input: T) {
  const copy = { ...input }
  delete copy.icon
  delete copy.iconType
  delete copy.iconText
  delete copy.iconImageUrl
  delete copy.iconImageLocalPath
  return copy
}

function loadMarketCatalog(): ToolItem[] {
  const raw = readFileSync(snapshotPath, 'utf8')
  return JSON.parse(raw) as ToolItem[]
}

async function main() {
  const tools = loadMarketCatalog()
  for (const tool of tools) {
    const input = {
      id: tool.id,
      name: tool.name,
      icon: tool.icon,
      iconType: tool.iconType ?? null,
      iconText: tool.iconText ?? null,
      iconImageUrl: tool.iconImageUrl ?? null,
      iconImageLocalPath: null,
      url: tool.url ?? null,
      description: tool.description,
      category: tool.category,
      tags: tool.tags,
      source: tool.source,
      status: tool.status,
      executionMode: tool.executionMode,
      pricingModel: tool.pricingModel,
      requiresAuth: tool.requiresAuth,
      platform: tool.platform,
      capabilities: tool.capabilities,
      recommendedFor: tool.recommendedFor,
      sourceNote: tool.sourceNote ?? null,
      trustSignals: tool.trustSignals,
      subscriptionSupport: tool.subscriptionSupport,
      defaultArgs: toJsonValue(tool.defaultArgs),
      isBuiltin: Boolean(tool.isBuiltin),
      siteHostname: tool.siteHostname ?? null,
      marketAssetOrigin: tool.marketAssetOrigin ?? null,
      seedSource: tool.source === 'submitted' ? 'user_submission' : 'system_seed',
    }

    await prisma.tool.upsert({
      where: { id: tool.id },
      create: input,
      update: withoutIconFields(input),
    })
  }
  console.log(`Seeded ${tools.length} market catalog tools`)
}

await main()
await prisma.$disconnect()
