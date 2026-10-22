import { createHash } from 'node:crypto'

export const TOOL_INDEX_TEMPLATE_VERSION = 'tool-index-v1'
export type EmbeddingConfig = { model: string; dimensions: number }
export type ToolIndexFields = {
  name: string
  description: string
  category: string
  tags: string[]
}

export const EMBEDDING_CONFIG = Object.freeze({ model: 'text-embedding-v3', dimensions: 1024 })

export function buildToolIndex(tool: ToolIndexFields, config: EmbeddingConfig = EMBEDDING_CONFIG) {
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
