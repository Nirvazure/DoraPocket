import assert from 'node:assert/strict'
import { mock, test } from 'node:test'

let updateData: Record<string, unknown> | null = null
mock.module('@/server/db/prisma', {
  namedExports: {
    prisma: {
      user: {
        update: async (args: { data: Record<string, unknown> }) => {
          updateData = args.data
          return { id: 'user-1', ...args.data }
        },
      },
    },
  },
})
const { updateUserProfile } = await import('./user-profile-repo')

test('profile update cannot replace the GitHub avatar', async () => {
  const input = {
    nickname: 'New name',
    avatarSrc: 'https://example.com/uploaded-avatar.png',
  }
  await updateUserProfile('user-1', input)
  assert.deepEqual(updateData, { nickname: 'New name' })
})
