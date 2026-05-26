import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'
import type * as Prisma from '../src/generated/prisma/internal/prismaNamespace'
import { PrismaClient } from '../src/generated/prisma/client'
import { TOOL_REGISTRY } from '../src/shared/tool-registry'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed tools')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

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

async function main() {
  for (const tool of TOOL_REGISTRY) {
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
}

await main()
await prisma.$disconnect()
