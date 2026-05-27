import type { Metadata } from 'next'
import { AuthBootstrap } from '@/components/providers/auth-bootstrap'
import { QueryProvider } from '@/components/providers/query-provider'
import { RealtimeSyncProvider } from '@/components/providers/realtime-sync'
import './globals.css'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'DoraPocket · 陪伴式能力口袋',
  description: '在你需要帮助时理解处境、做出工具裁决，并把高价值帮助沉淀成可复用资产。',
  icons: {
    icon: '/images/pocket.png',
    shortcut: '/images/pocket.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={cn('h-full antialiased', 'font-sans')}
      data-font-preset="c"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <AuthBootstrap />
          <RealtimeSyncProvider />
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
