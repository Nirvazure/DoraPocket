import { NextResponse } from 'next/server'
import { listActiveToolItems } from '@/server/market/tool-catalog'

export async function GET() {
  return NextResponse.json(await listActiveToolItems())
}
