import { NextRequest, NextResponse } from 'next/server'
import { maintenanceResponse } from '@/server/maintenance'

export function proxy(request: NextRequest) {
  return maintenanceResponse(request, process.env.DORAPOCKET_MAINTENANCE) ?? NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
