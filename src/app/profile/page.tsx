import type { Metadata } from 'next'
import { ProfilePage } from '@/components/profile-page'

export const metadata: Metadata = {
  title: '个人中心 · DoraPocket',
  description: '查看 DoraPocket 如何理解你、记录你，并通过历史摘要与画像控制持续优化下一次体验。',
}

export default function ProfileRoutePage() {
  return <ProfilePage />
}
