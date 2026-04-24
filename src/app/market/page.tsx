import type { Metadata } from 'next'
import { MarketPage } from '@/components/market-page'

export const metadata: Metadata = {
  title: '市场页 · DoraPocket',
  description: '按类别浏览 DoraPocket 原生能力与优秀工具。',
}

export default function MarketRoutePage() {
  return <MarketPage />
}
