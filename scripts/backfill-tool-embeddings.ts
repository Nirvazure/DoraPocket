import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { syncToolEmbedding } from '../src/server/retrieval/tool-embedding'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const tools = await prisma.tool.findMany({
  where: { status: 'active' },
  select: { id: true, name: true },
})

console.log(`backfill: ${tools.length} active tools`)

for (const tool of tools) {
  await syncToolEmbedding(tool.id)
  console.log(`  ${tool.id} (${tool.name})`)
}

await prisma.$disconnect()
