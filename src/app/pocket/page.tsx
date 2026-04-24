import type { Metadata } from 'next'
import { PocketPage } from '@/components/pocket-page'

export const metadata: Metadata = {
  title: '口袋页 · DoraPocket',
  description: '管理收藏工具、复用入口与归档资产，让口袋更纯粹。',
}

export default function PocketRoutePage() {
  return <PocketPage />
}
