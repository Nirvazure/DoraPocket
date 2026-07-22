import assert from 'node:assert/strict'
import test from 'node:test'
import type { TestContext } from 'node:test'

process.env.DATABASE_URL ??= 'postgresql://user:password@localhost:5432/dorapocket_test'

const { deleteOwnedTool } = await import('@/server/repositories/tool-repo')
const { OwnedToolDeleteError } = await import('@/shared/market/owned-tool-delete')
const { prisma } = await import('@/server/db/prisma')

const toolDelegate = prisma.tool

type FindUniqueArgs = Parameters<typeof toolDelegate.findUnique>[0]
type DeleteArgs = Parameters<typeof toolDelegate.delete>[0]

function replaceToolDelegates(
  t: TestContext,
  impl: {
    findUnique: (
      args: FindUniqueArgs,
    ) => Promise<{ id: string; createdByUserId: string | null } | null>
    delete: (args: DeleteArgs) => Promise<{ id: string }>
  },
) {
  const originalFindUnique = toolDelegate.findUnique
  const originalDelete = toolDelegate.delete
  toolDelegate.findUnique = impl.findUnique as unknown as typeof toolDelegate.findUnique
  toolDelegate.delete = impl.delete as unknown as typeof toolDelegate.delete
  t.after(() => {
    toolDelegate.findUnique = originalFindUnique
    toolDelegate.delete = originalDelete
  })
}

test('deleteOwnedTool deletes when caller owns the tool', async (t) => {
  let deletedId: string | null = null
  replaceToolDelegates(t, {
    findUnique: async () => ({ id: 'tool_1', createdByUserId: 'user-1' }),
    delete: async (args) => {
      deletedId = (args.where as { id: string }).id
      return { id: 'tool_1' }
    },
  })

  const result = await deleteOwnedTool('user-1', 'tool_1')
  assert.equal(result.id, 'tool_1')
  assert.equal(deletedId, 'tool_1')
})

test('deleteOwnedTool throws NOT_FOUND when tool missing', async (t) => {
  replaceToolDelegates(t, {
    findUnique: async () => null,
    delete: async () => {
      throw new Error('delete should not run')
    },
  })

  await assert.rejects(
    () => deleteOwnedTool('user-1', 'missing'),
    (error: unknown) => error instanceof OwnedToolDeleteError && error.code === 'NOT_FOUND',
  )
})

test('deleteOwnedTool throws FORBIDDEN when caller is not owner', async (t) => {
  replaceToolDelegates(t, {
    findUnique: async () => ({ id: 'tool_1', createdByUserId: 'other' }),
    delete: async () => {
      throw new Error('delete should not run')
    },
  })

  await assert.rejects(
    () => deleteOwnedTool('user-1', 'tool_1'),
    (error: unknown) => error instanceof OwnedToolDeleteError && error.code === 'FORBIDDEN',
  )
})
