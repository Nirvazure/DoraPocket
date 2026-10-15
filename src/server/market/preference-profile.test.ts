import assert from 'node:assert/strict'
import test from 'node:test'

import { inferUserPreferenceProfile } from '@/server/market/preference-profile'

const tools = [
  {
    id: 'writer',
    category: 'writing',
    tags: ['copywriting'],
    platform: 'web',
    pricingModel: 'free',
    requiresAuth: false,
  },
  {
    id: 'video',
    category: 'video',
    tags: ['video'],
    platform: 'web',
    pricingModel: 'paid',
    requiresAuth: true,
  },
] as never

test('inferUserPreferenceProfile weights helpful recommendation evaluations', () => {
  const profile = inferUserPreferenceProfile({
    pocketInventory: [],
    feedback: [],
    activityMap: {},
    tools,
    recommendationEvaluations: [
      {
        selectedToolId: 'writer',
        helpful: true,
        rating: 5,
      },
    ],
  })

  assert.ok(profile.preferredCategories.includes('writing'))
  assert.ok(profile.preferredTags.includes('copywriting'))
})

test('inferUserPreferenceProfile downranks unhelpful recommendation evaluations', () => {
  const profile = inferUserPreferenceProfile({
    pocketInventory: [],
    feedback: [],
    activityMap: {},
    tools,
    recommendationEvaluations: [
      {
        selectedToolId: 'video',
        helpful: false,
        rating: 1,
      },
      {
        selectedToolId: 'writer',
        helpful: true,
        rating: 5,
      },
    ],
  })

  assert.equal(profile.preferredCategories[0], 'writing')
})

test('unknown login requirements do not imply a preference for tools without signup', () => {
  const profile = inferUserPreferenceProfile({
    pocketInventory: [],
    feedback: [],
    activityMap: {},
    tools: [
      {
        id: 'unknown',
        category: 'other',
        tags: [],
        platform: 'unknown',
        pricingModel: 'unknown',
        requiresAuth: null,
      },
    ] as never,
    recommendationEvaluations: [{ selectedToolId: 'unknown', helpful: true, rating: 5 }],
  })
  assert.equal(profile.avoidAuthWall, false)
  assert.deepEqual(profile.preferredPlatforms, [])
  assert.deepEqual(profile.preferredPricing, [])
})
