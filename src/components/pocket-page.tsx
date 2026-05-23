'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { LogIn, Search, Settings2, UserRound } from 'lucide-react'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { PocketSettingsModal } from '@/components/pocket/pocket-settings-modal'
import { PocketToolCard } from '@/components/pocket/pocket-tool-card'
import {
  filterPocketItems,
  getPocketAvailableCategories,
  getPocketCategoryLabel,
  getPocketStats,
  type PocketCategoryFilter,
} from '@/components/pocket/pocket-utils'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { Input } from '@/components/ui/input'
import { useAuthSessionQuery } from '@/lib/query/auth-session'
import {
  useMarkToolUsedMutation,
  usePocketInventoryQuery,
  useRemoveToolFromPocketMutation,
} from '@/lib/query/pocket'
import { useSaveUserSettingsMutation, useUserSettingsQuery } from '@/lib/query/user-settings'
import { cn } from '@/lib/utils'
import { PAGE_COPY } from '@/shared/ui-copy'

export function PocketPage() {
  const { data: authSession } = useAuthSessionQuery()
  const { data: pocketInventory = [] } = usePocketInventoryQuery()
  const { data: userSettings } = useUserSettingsQuery()
  const saveUserSettingsMutation = useSaveUserSettingsMutation()
  const removeToolMutation = useRemoveToolFromPocketMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PocketCategoryFilter>('all')

  const user =
    authSession && authSession.authenticated === true && 'user' in authSession
      ? (authSession.user ?? null)
      : null
  const isAuthenticated = user != null

  const activePocketItems = useMemo(
    () => pocketInventory.filter((item) => !item.archived),
    [pocketInventory],
  )
  const availableCategories = useMemo(
    () => getPocketAvailableCategories(activePocketItems),
    [activePocketItems],
  )
  const stats = useMemo(() => getPocketStats(pocketInventory), [pocketInventory])
  const resolvedCategory =
    category === 'all' || availableCategories.includes(category) ? category : 'all'
  const visibleItems = useMemo(
    () => filterPocketItems(pocketInventory, query, resolvedCategory),
    [pocketInventory, query, resolvedCategory],
  )

  return (
    <PageShell
      contentClassName="pb-8 pt-4 sm:pt-5 lg:pt-6"
      header={
        <UnifiedTopBar
          title={PAGE_COPY.pocket.title}
          subtitle={PAGE_COPY.pocket.subtitle}
          rightSlot={
            <div className="flex items-center gap-2">
              <TopNavSwitch current="pocket" />
              <ProfileEntryPill active />
            </div>
          }
        />
      }
    >
      <div className="space-y-4">
        <DisplayPanel className="rounded-[2.4rem] border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.92)_55%,rgba(248,250,252,0.96)_100%)] shadow-[0_28px_86px_rgba(14,165,233,0.10)]">
          <DisplayPanelContent className="p-6 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.6rem] border border-white bg-white shadow-sm">
                  {user?.avatarSrc ? (
                    <Image
                      src={user.avatarSrc}
                      alt="我的头像"
                      width={64}
                      height={64}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-[0_14px_28px_rgba(14,165,233,0.18)]">
                      <UserRound className="h-5 w-5" />
                    </span>
                  )}
                </span>

                <div className="min-w-0 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                    My Pocket
                  </p>
                  <DisplayPanelTitle className="text-2xl text-slate-950 sm:text-3xl">
                    {user?.nickname ?? '先登录，再把工具装进口袋'}
                  </DisplayPanelTitle>
                  <DisplayPanelDescription className="max-w-2xl text-sm leading-7 text-slate-600">
                    {user
                      ? (user.email ?? '你的收藏、设置和常用工具都会在这里收好。')
                      : '登录后，DoraPocket 才能替你同步收藏和设置，把口袋真正带走。'}
                  </DisplayPanelDescription>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-full px-4 text-sm font-bold"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings2 className="h-4 w-4" />
                  口袋设置
                </Button>
                {!isAuthenticated ? (
                  <a
                    href="/login"
                    className={cn(
                      buttonVariants({ variant: 'default' }),
                      'h-10 rounded-full px-4 text-sm font-bold',
                    )}
                  >
                    <LogIn className="h-4 w-4" />
                    去登录
                  </a>
                ) : null}
              </div>
            </div>
          </DisplayPanelContent>
        </DisplayPanel>

        <DisplayPanel className="rounded-[2.4rem] border-white/90 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
          <DisplayPanelHeader className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <DisplayPanelTitle className="text-2xl text-slate-950">我的工具</DisplayPanelTitle>
                <DisplayPanelDescription className="mt-2 text-sm text-slate-600">
                  这里放的是你已经决定留下来的工具。市场负责发现，口袋负责收好。
                </DisplayPanelDescription>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">已收藏 {stats.total}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    分类 {stats.categories}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href="/analyse"
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    'h-10 rounded-full px-4 text-sm font-bold',
                  )}
                >
                  {PAGE_COPY.pocket.backToAnalysisAction}
                </a>
                <a
                  href="/market"
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'h-10 rounded-full px-4 text-sm font-bold',
                  )}
                >
                  {PAGE_COPY.pocket.goMarketAction}
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={PAGE_COPY.pocket.searchPlaceholder}
                  className="h-11 rounded-full border-slate-200 bg-slate-50 pl-11"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center rounded-full border px-3 py-2 text-xs font-bold transition-colors',
                    category === 'all'
                      ? 'border-primary/15 bg-primary text-primary-foreground'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/15 hover:bg-white',
                  )}
                  onClick={() => setCategory('all')}
                >
                  全部
                </button>
                {availableCategories.map((entry) => (
                  <button
                    key={entry}
                    type="button"
                    className={cn(
                      'inline-flex items-center rounded-full border px-3 py-2 text-xs font-bold transition-colors',
                      resolvedCategory === entry
                        ? 'border-primary/15 bg-primary text-primary-foreground'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/15 hover:bg-white',
                    )}
                    onClick={() => setCategory(entry)}
                  >
                    {getPocketCategoryLabel(entry)}
                  </button>
                ))}
              </div>
            </div>
          </DisplayPanelHeader>

          <DisplayPanelContent>
            {activePocketItems.length === 0 ? (
              <DisplayPanel className="rounded-[1.8rem] border-dashed border-slate-200 bg-slate-50/80 shadow-none">
                <DisplayPanelContent className="space-y-2 p-6 text-center">
                  <p className="text-xl font-black text-slate-950">{PAGE_COPY.pocket.emptyTitle}</p>
                  <p className="text-sm text-slate-600">{PAGE_COPY.pocket.emptyDescription}</p>
                </DisplayPanelContent>
              </DisplayPanel>
            ) : visibleItems.length === 0 ? (
              <DisplayPanel className="rounded-[1.8rem] border-dashed border-slate-200 bg-slate-50/80 shadow-none">
                <DisplayPanelContent className="space-y-2 p-6 text-center">
                  <p className="text-xl font-black text-slate-950">没有找到匹配的收藏</p>
                  <p className="text-sm text-slate-600">{PAGE_COPY.pocket.noSearchResult}</p>
                </DisplayPanelContent>
              </DisplayPanel>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleItems.map((item) => (
                  <PocketToolCard
                    key={item.toolId}
                    item={item}
                    onOpen={(toolId) => markToolUsedMutation.mutate({ toolId })}
                    onRemove={(toolId) => removeToolMutation.mutate({ toolId })}
                  />
                ))}
              </div>
            )}
          </DisplayPanelContent>
        </DisplayPanel>
      </div>

      <PocketSettingsModal
        open={settingsOpen}
        settings={userSettings}
        onClose={() => setSettingsOpen(false)}
        onSave={saveUserSettingsMutation.mutate}
      />
    </PageShell>
  )
}
