import type { Metadata } from 'next'
import { MarketPage } from '@/components/market-page'

export const metadata: Metadata = {
  title: '道具库 | DoraPocket',
  description: '发现好工具、提交好工具，帮助 DoraPocket 长出更好的工具知识库。',
}

export default function MarketRoutePage() {
  return <MarketPage />
}
