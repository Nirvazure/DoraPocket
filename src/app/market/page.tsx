import type { Metadata } from 'next'
import { MarketPageClient } from './market-page-client'
import type { MarketSectionKey } from '@/shared/market-scope'

export const metadata: Metadata = {
  title: '道具库 | DoraPocket',
  description: '发现好工具、提交好工具，帮助 DoraPocket 长出更好的工具知识库。',
}

type MarketRoutePageProps = {
  searchParams: Promise<{ section?: string }>
}

export default async function MarketRoutePage({ searchParams }: MarketRoutePageProps) {
  const params = await searchParams
  const initialSection: MarketSectionKey | null = params.section === 'pocket' ? 'pocket' : null
  return <MarketPageClient initialSection={initialSection} />
}
