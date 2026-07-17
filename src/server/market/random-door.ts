import 'server-only'

import { listActiveToolItems } from '@/server/market/tool-catalog'
import {
  pickRandomDoorRecommendation,
  type RandomDoorRecommendation,
} from '@/shared/market/random-door'

export async function createRandomDoorRecommendation(
  rng: () => number = Math.random,
): Promise<RandomDoorRecommendation | null> {
  const tools = await listActiveToolItems()
  return pickRandomDoorRecommendation(tools, rng)
}
