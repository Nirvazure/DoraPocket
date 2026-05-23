import { NextResponse } from 'next/server'
import { listActiveToolItems } from '@/server/market/tool-catalog'
import { verifySession } from '@/server/auth/dal'
import { getUserSettings } from '@/server/repositories/user-settings-repo'

export async function GET() {
  try {
    let builtinToolsEnabled = false

    try {
      const session = await verifySession()
      if (session?.user) {
        builtinToolsEnabled = (await getUserSettings(session.user.id)).builtinToolsEnabled
      }
    } catch (error) {
      console.warn('[market/tools] Falling back to builtin tools disabled', error)
    }

    return NextResponse.json(await listActiveToolItems(builtinToolsEnabled))
  } catch (error) {
    console.error('[market/tools] Failed to list active tools', error)
    return NextResponse.json({ message: 'Failed to list market tools' }, { status: 500 })
  }
}
