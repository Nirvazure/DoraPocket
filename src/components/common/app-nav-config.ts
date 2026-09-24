export type AppNavPage = 'analysis' | 'market' | 'profile'

export const APP_NAV_ITEMS = [
  { key: 'analysis', label: '分析', href: '/analyse' },
  { key: 'market', label: '道具库', href: '/market' },
] as const satisfies ReadonlyArray<{
  key: AppNavPage
  label: string
  href: string
}>
