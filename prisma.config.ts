import 'dotenv/config'

import { defineConfig } from 'prisma/config'

const isDatabaseMigration = process.argv.includes('migrate') && !process.argv.includes('diff')
const migrationUrl = process.env.MIGRATION_DATABASE_URL?.trim()
if (isDatabaseMigration && !migrationUrl) {
  throw new Error(
    'MIGRATION_DATABASE_URL is required for database migrations; use a dedicated DDL connection',
  )
}
const connectionUrl =
  migrationUrl || (isDatabaseMigration ? undefined : process.env.DATABASE_URL?.trim())
let url = ''
if (connectionUrl) {
  const parsed = new URL(connectionUrl)
  const schema = parsed.searchParams.get('schema')
  if (schema && schema !== 'dorapocket') throw new Error('Database URL schema must be dorapocket')
  parsed.searchParams.set('schema', 'dorapocket')
  url = parsed.toString()
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations-dorapocket',
  },
  datasource: {
    url,
  },
})
