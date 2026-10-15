import { NextRequest, NextResponse } from 'next/server'

export function maintenanceResponse(request: NextRequest, flag: string | undefined) {
  const path = request.nextUrl.pathname
  if (flag !== 'true' || path.startsWith('/_next/') || path === '/favicon.ico') return null

  const headers = { 'Retry-After': '300', 'Cache-Control': 'no-store' }
  if (path.startsWith('/api/')) {
    return NextResponse.json({ message: '系统维护中，请稍后再试。' }, { status: 503, headers })
  }

  return new NextResponse(
    '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>DoraPocket · 维护中</title><body><main><h1>系统维护中</h1><p>我们正在迁移数据，请稍后再试。</p></main></body></html>',
    { status: 503, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
