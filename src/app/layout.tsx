import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DoraPocket · 陪伴式能力口袋',
  description: '在你需要帮助时理解处境、做出工具裁决，并把高价值帮助沉淀成可复用资产。',
  icons: {
    icon: '/icon/pocket.png',
    shortcut: '/icon/pocket.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
