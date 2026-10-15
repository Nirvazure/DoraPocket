import 'server-only'

import type { ToolModel as DbTool } from '../../generated/prisma/models/Tool'
import { listActiveTools } from '@/server/repositories/tool-repo'
import type { ToolItem } from '@/shared/market/tool-registry'
import { resolveIsOwnedByViewer } from '@/shared/market/owned-tool-delete'

type CatalogTool = DbTool & {
  marketFeedback?: { vote: string }[]
  toolActivities?: { saves: number; opens: number }[]
}

export function mapDbToolToToolItem(tool: CatalogTool, viewerUserId?: string | null): ToolItem {
  const upvotes = tool.marketFeedback?.filter((feedback) => feedback.vote === 'up').length ?? 0
  const downvotes = tool.marketFeedback?.filter((feedback) => feedback.vote === 'down').length ?? 0
  return {
    id: tool.id,
    name: tool.name,
    url: tool.url,
    description: tool.description,
    category: tool.category as ToolItem['category'],
    tags: tool.tags,
    iconUrl: tool.iconUrl,
    status: tool.status as ToolItem['status'],
    pricingModel: tool.pricingModel as ToolItem['pricingModel'],
    requiresAuth: tool.requiresAuth,
    platform: tool.platform as ToolItem['platform'],
    createdByUserId: tool.createdByUserId,
    isOwnedByViewer: resolveIsOwnedByViewer(tool.createdByUserId, viewerUserId),
    ratingSummary: { upvotes, downvotes, score: upvotes - downvotes },
    usageStats: {
      saves: tool.toolActivities?.reduce((sum, activity) => sum + activity.saves, 0) ?? 0,
      opens: tool.toolActivities?.reduce((sum, activity) => sum + activity.opens, 0) ?? 0,
    },
  }
}

export async function listActiveToolItems(viewerUserId?: string | null) {
  return (await listActiveTools()).map((tool) => mapDbToolToToolItem(tool, viewerUserId))
}
