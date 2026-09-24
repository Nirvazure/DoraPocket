import type { Metadata } from 'next'
import { MarketPageClient } from './market-page-client'
import type { MarketSectionKey } from '@/shared/market/market-scope'

export const metadata: Metadata = {
  title: '道具库 | DoraPocket',
  description: '我们一起来充实哆啦A梦的口袋吧',
}

type MarketRoutePageProps = {
  searchParams: Promise<{ section?: string }>
}

export default async function MarketRoutePage({ searchParams }: MarketRoutePageProps) {
  const params = await searchParams
  const initialSection: MarketSectionKey | null = params.section === 'pocket' ? 'pocket' : null
  return <MarketPageClient initialSection={initialSection} />
}
