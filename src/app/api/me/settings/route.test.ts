import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

let authenticated = true
let requestedUserId: string | null = null
const savedSettings = {
  voicePlaybackEnabled: false,
  voicePlaybackMode: 'off',
  soundEffectsEnabled: true,
  defaultInputMode: 'text',
  memoryEnabled: true,
  explanationMode: 'brief',
  fontPreset: 'b',
}

mock.module('@/server/auth/dal', {
  namedExports: {
    verifySession: async () => (authenticated ? { user: { id: 'user-1' } } : null),
  },
})
mock.module('@/server/repositories/user-settings-repo', {
  namedExports: {
    getUserSettings: async (userId: string) => {
      requestedUserId = userId
      return savedSettings
    },
  },
})

const { GET } = await import('./route')

test('settings remain readable for analysis only with a valid session', async () => {
  const response = await GET()
  assert.equal(response.status, 200)
  assert.equal(requestedUserId, 'user-1')
  assert.deepEqual(await response.json(), savedSettings)

  authenticated = false
  requestedUserId = null
  const anonymousResponse = await GET()
  assert.equal(anonymousResponse.status, 401)
  assert.equal(requestedUserId, null)
})
