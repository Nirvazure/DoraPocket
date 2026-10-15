import { createHash } from 'node:crypto'

export const TOOL_INDEX_TEMPLATE_VERSION = 'tool-index-v1'
export type EmbeddingConfig = { model: string; dimensions: number }
export type ToolIndexFields = {
  name: string
  description: string
  category: string
  tags: string[]
}

export function getEmbeddingConfig(
  env: Record<string, string | undefined> = process.env,
): EmbeddingConfig {
  const dimensions = Number(env.QWEN_EMBEDDING_DIMENSIONS ?? 1024)
  if (dimensions !== 1024)
    throw new Error('QWEN_EMBEDDING_DIMENSIONS must be 1024 for ToolIndex storage')
  return { model: env.QWEN_EMBEDDING_MODEL?.trim() || 'text-embedding-v3', dimensions }
}

export function buildToolIndex(tool: ToolIndexFields, config = getEmbeddingConfig()) {
  const content = [
    `Name: ${tool.name.trim()}`,
    `Description: ${tool.description.trim()}`,
    `Category: ${tool.category.trim()}`,
    `Tags: ${tool.tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .join(', ')}`,
  ].join('\n')
  const contentHash = createHash('sha256')
    .update(JSON.stringify([TOOL_INDEX_TEMPLATE_VERSION, config.model, config.dimensions, content]))
    .digest('hex')
  return { content, contentHash }
}
