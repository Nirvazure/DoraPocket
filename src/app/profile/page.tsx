import type { Metadata } from 'next'
import { ProfilePageClient } from './profile-page-client'

export const metadata: Metadata = {
  title: '我的 | DoraPocket',
  description: '账户信息与 DoraPocket 偏好设置。',
}

export default function ProfileRoutePage() {
  return <ProfilePageClient />
}
