import type { Metadata } from 'next'
import { PocketPage } from '@/components/pocket-page'

export const metadata: Metadata = {
  title: '我的口袋 | DoraPocket',
  description: '在一个页面里管理账户信息、设置和我的工具。',
}

export default function PocketRoutePage() {
  return <PocketPage />
}
