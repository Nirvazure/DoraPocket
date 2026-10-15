import { prisma } from './prisma'

let extensionSchemas: Promise<Record<string, string>> | undefined

// Extensions may already live in public or extensions. Never relocate a shared extension.
export async function getExtensionSchema(name: 'vector' | 'pg_trgm'): Promise<string> {
  extensionSchemas ??= prisma
    .$queryRawUnsafe<Array<{ name: string; schema: string }>>(
      `SELECT e.extname AS name, n.nspname AS schema
     FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
     WHERE e.extname IN ('vector', 'pg_trgm')`,
    )
    .then((rows) => Object.fromEntries(rows.map((row) => [row.name, row.schema])))
    .catch((error) => {
      extensionSchemas = undefined
      throw error
    })
  const schema = (await extensionSchemas)[name]
  if (!schema) throw new Error(`Required database extension ${name} is missing`)
  return `"${schema.replaceAll('"', '""')}"`
}
