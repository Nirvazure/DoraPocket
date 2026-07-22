import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/server/auth/dal'
import { deleteOwnedTool } from '@/server/repositories/tool-repo'
import { OwnedToolDeleteError } from '@/shared/market/owned-tool-delete'

type RouteContext = {
  params: Promise<{ toolId: string }>
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await verifySession()
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { toolId } = await context.params

  try {
    const deleted = await deleteOwnedTool(session.user.id, toolId)
    return NextResponse.json({ id: deleted.id })
  } catch (error) {
    if (error instanceof OwnedToolDeleteError) {
      if (error.code === 'NOT_FOUND') {
        return NextResponse.json({ message: 'Tool not found' }, { status: 404 })
      }
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    console.error('[market/tools/[toolId]] Failed to delete tool', error)
    return NextResponse.json({ message: 'Failed to delete market tool' }, { status: 500 })
  }
}
