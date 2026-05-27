import fs from 'node:fs'

const src = fs.readFileSync('scripts/legacy-favicon-oss-manifest.ts', 'utf8')
const keys = {}
for (const m of src.matchAll(/"([^"]+)":\s*\{[^}]*"faviconObjectKey":\s*"([^"]+)"/g)) {
  keys[m[1]] = m[2]
}
const out = `export const MARKET_ICON_OBJECT_KEYS: Record<string, string> = ${JSON.stringify(keys, null, 2)}\n`
fs.writeFileSync('src/shared/market-icon-object-keys.ts', out)
console.log('keys', Object.keys(keys).length)
