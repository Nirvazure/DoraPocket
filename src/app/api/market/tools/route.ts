import { NextResponse } from 'next/server'
import { listActiveToolItems } from '@/server/market/tool-catalog'

export async function GET() {
  try {
    return NextResponse.json(await listActiveToolItems())
  } catch (error) {
    console.error('[market/tools] Failed to list active tools', error)
    return NextResponse.json({ message: 'Failed to list market tools' }, { status: 500 })
  }
}
