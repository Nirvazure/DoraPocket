import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../../generated/prisma/client'

const globalForPrisma = globalThis as typeof globalThis & {
  __prisma?: PrismaClient
}

const DEFAULT_DATABASE_POOL_MAX = 5

export function getDatabasePoolMax(value = process.env.DATABASE_POOL_MAX): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_DATABASE_POOL_MAX
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim()
  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  const adapter = new PrismaPg({
    connectionString,
    max: getDatabasePoolMax(),
  })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })
}

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.__prisma) return globalForPrisma.__prisma
  const client = createPrismaClient()
  globalForPrisma.__prisma = client
  return client
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient()
    const value = Reflect.get(client, property, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})
