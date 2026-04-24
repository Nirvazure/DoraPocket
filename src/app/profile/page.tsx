import type { Metadata } from 'next'
import { ProfilePage } from '@/components/profile-page'

export const metadata: Metadata = {
  title: '个人中心 · DoraPocket',
  description: '管理头像、偏好、历史与行为回流，让 DoraPocket 更懂你。',
}

export default function ProfileRoutePage() {
  return <ProfilePage />
}
