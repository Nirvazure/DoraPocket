import 'dotenv/config'

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

const rows = await prisma.$queryRawUnsafe<Array<{ with_emb: number; total: number }>>(
  `SELECT COUNT(*) FILTER (WHERE "embedding" IS NOT NULL)::int AS with_emb,
          COUNT(*)::int AS total
   FROM "Tool" WHERE "status" = 'active'`,
)

console.log('embeddings:', rows[0])
await prisma.$disconnect()
