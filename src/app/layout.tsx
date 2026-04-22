import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DoraPocket Next',
  description: 'DoraPocket Next.js migration',
  icons: {
    icon: '/icon/dora-pocket.svg',
    shortcut: '/icon/dora-pocket.svg',
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
