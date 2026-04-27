import type { Metadata } from 'next'
import { SettingsPage } from '@/components/settings-page'

export const metadata: Metadata = {
  title: '设置 · DoraPocket',
  description: '管理陪伴方式、记忆策略与推荐呈现方式，让 DoraPocket 更安静也更懂你。',
}

export default function ProfileSettingsRoutePage() {
  return <SettingsPage />
}
