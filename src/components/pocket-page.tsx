'use client'

import Image from 'next/image'
import { Archive, ExternalLink, LogIn, Package2, Pin, Settings2, UserRound } from 'lucide-react'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { PageShell } from '@/components/common/page-shell'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelDescription,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { useAuthSessionQuery } from '@/lib/query/auth-session'
import {
  useMarkToolUsedMutation,
  usePocketInventoryQuery,
  useRemoveToolFromPocketMutation,
  useToggleArchiveToolMutation,
  useTogglePinToolMutation,
  useTogglePurchasedToolMutation,
} from '@/lib/query/pocket'
import { useSaveUserSettingsMutation, useUserSettingsQuery } from '@/lib/query/user-settings'
import { cn } from '@/lib/utils'
import { getToolById } from '@/services/tool-registry'
import type { UserSettings } from '@/services/user-settings'
import { PAGE_COPY } from '@/shared/ui-copy'

function formatTime(value: number) {
  return new Date(value).toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
}

function resolveToolHref(toolId: string) {
  const tool = getToolById(toolId)
  if (!tool) return '/analyse'
  return tool.url ?? '/analyse'
}

function updateSettings(
  current: UserSettings | undefined,
  patch: Partial<UserSettings>,
  save: (next: UserSettings) => void,
) {
  if (!current) return
  save({ ...current, ...patch })
}

export function PocketPage() {
  const { data: authSession } = useAuthSessionQuery()
  const { data: pocketInventory = [] } = usePocketInventoryQuery()
  const { data: userSettings } = useUserSettingsQuery()
  const saveUserSettingsMutation = useSaveUserSettingsMutation()
  const togglePinMutation = useTogglePinToolMutation()
  const toggleArchiveMutation = useToggleArchiveToolMutation()
  const togglePurchasedMutation = useTogglePurchasedToolMutation()
  const removeToolMutation = useRemoveToolFromPocketMutation()
  const markToolUsedMutation = useMarkToolUsedMutation()

  const user =
    authSession && authSession.authenticated === true && 'user' in authSession
      ? (authSession.user ?? null)
      : null
  const isAuthenticated = user != null

  const activeTools = pocketInventory.filter((item) => !item.archived)
  const pinnedTools = activeTools.filter((item) => item.pinned)
  const regularTools = activeTools.filter((item) => !item.pinned)
  const archivedTools = pocketInventory.filter((item) => item.archived)

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
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <DisplayPanel className="rounded-[2.4rem] border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,249,255,0.94)_50%,rgba(224,242,254,0.92)_100%)] shadow-[0_28px_86px_rgba(14,165,233,0.12)]">
          <DisplayPanelHeader className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_14px_28px_rgba(14,165,233,0.18)]">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <DisplayPanelTitle className="text-2xl text-slate-950">账户信息</DisplayPanelTitle>
                <DisplayPanelDescription>
                  登录状态、昵称和账号入口都收回到我的口袋。
                </DisplayPanelDescription>
              </div>
            </div>
          </DisplayPanelHeader>
          <DisplayPanelContent className="grid gap-3 md:grid-cols-2">
            {user ? (
              <>
                <DisplayPanel className="rounded-[1.6rem] border-white/90 bg-white/86 shadow-sm">
                  <DisplayPanelContent className="flex items-center gap-4 p-5">
                    <span className="inline-flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white bg-slate-100">
                      <Image
                        src={user.avatarSrc ?? '/images/assistant-avatar.svg'}
                        alt="我的头像"
                        width={56}
                        height={56}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-lg font-black text-slate-950">{user.nickname}</p>
                      <p className="truncate text-sm text-slate-600">
                        {user.email ?? '已登录，可同步你的工具与设置'}
                      </p>
                    </div>
                  </DisplayPanelContent>
                </DisplayPanel>
                <DisplayPanel className="rounded-[1.6rem] border-white/90 bg-white/86 shadow-sm">
                  <DisplayPanelContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-700">工具数量</span>
                      <span className="text-lg font-black text-slate-950">
                        {pocketInventory.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-700">常用工具</span>
                      <span className="text-lg font-black text-slate-950">
                        {pinnedTools.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-slate-700">已归档</span>
                      <span className="text-lg font-black text-slate-950">
                        {archivedTools.length}
                      </span>
                    </div>
                  </DisplayPanelContent>
                </DisplayPanel>
              </>
            ) : (
              <DisplayPanel className="rounded-[1.6rem] border-white/90 bg-white/86 shadow-sm md:col-span-2">
                <DisplayPanelContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-950">登录后再装满你的口袋</p>
                    <p className="mt-1 text-sm text-slate-600">
                      登录后即可同步我的工具、设置和账号信息。
                    </p>
                  </div>
                  <Button
                    nativeButton={false}
                    render={<a href="/login" />}
                    className="h-11 rounded-full px-5 text-sm font-black"
                  >
                    <LogIn className="h-4 w-4" />
                    去登录
                  </Button>
                </DisplayPanelContent>
              </DisplayPanel>
            )}
          </DisplayPanelContent>
        </DisplayPanel>

        <DisplayPanel className="rounded-[2.4rem] border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94)_50%,rgba(241,245,249,0.92)_100%)] shadow-[0_28px_86px_rgba(15,23,42,0.10)]">
          <DisplayPanelHeader className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]">
                <Settings2 className="h-5 w-5" />
              </span>
              <div>
                <DisplayPanelTitle className="text-2xl text-slate-950">设置</DisplayPanelTitle>
                <DisplayPanelDescription>
                  控制 DoraPocket 怎么出手、怎么解释、是否自动把工具收进口袋。
                </DisplayPanelDescription>
              </div>
            </div>
          </DisplayPanelHeader>
          <DisplayPanelContent className="grid gap-3 md:grid-cols-2">
            <DisplayPanel className="rounded-[1.6rem] border-white/90 bg-white/86 shadow-sm">
              <DisplayPanelContent className="space-y-3 p-5">
                <p className="text-sm font-black text-slate-950">默认输入方式</p>
                <div className="flex gap-2">
                  {(['text', 'voice'] as const).map((mode) => (
                    <Button
                      key={mode}
                      type="button"
                      variant={userSettings?.defaultInputMode === mode ? 'default' : 'outline'}
                      className="rounded-full px-4 text-xs font-bold"
                      onClick={() =>
                        updateSettings(
                          userSettings,
                          { defaultInputMode: mode },
                          saveUserSettingsMutation.mutate,
                        )
                      }
                    >
                      {mode === 'text' ? '文字' : '语音'}
                    </Button>
                  ))}
                </div>
              </DisplayPanelContent>
            </DisplayPanel>

            <DisplayPanel className="rounded-[1.6rem] border-white/90 bg-white/86 shadow-sm">
              <DisplayPanelContent className="space-y-3 p-5">
                <p className="text-sm font-black text-slate-950">解释详细度</p>
                <div className="flex gap-2">
                  {(
                    [
                      { value: 'brief', label: '更直接' },
                      { value: 'standard', label: '保留理由' },
                    ] as const
                  ).map((item) => (
                    <Button
                      key={item.value}
                      type="button"
                      variant={userSettings?.explanationMode === item.value ? 'default' : 'outline'}
                      className="rounded-full px-4 text-xs font-bold"
                      onClick={() =>
                        updateSettings(
                          userSettings,
                          { explanationMode: item.value },
                          saveUserSettingsMutation.mutate,
                        )
                      }
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </DisplayPanelContent>
            </DisplayPanel>

            <DisplayPanel className="rounded-[1.6rem] border-white/90 bg-white/86 shadow-sm">
              <DisplayPanelContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">自动收进口袋</p>
                    <p className="text-xs text-slate-600">值得以后再用时，替你先收好。</p>
                  </div>
                  <Button
                    type="button"
                    variant={userSettings?.autoSaveToPocketEnabled ? 'default' : 'outline'}
                    className="rounded-full px-4 text-xs font-bold"
                    onClick={() =>
                      updateSettings(
                        userSettings,
                        { autoSaveToPocketEnabled: !userSettings?.autoSaveToPocketEnabled },
                        saveUserSettingsMutation.mutate,
                      )
                    }
                  >
                    {userSettings?.autoSaveToPocketEnabled ? '已开启' : '已关闭'}
                  </Button>
                </div>
              </DisplayPanelContent>
            </DisplayPanel>

            <DisplayPanel className="rounded-[1.6rem] border-white/90 bg-white/86 shadow-sm">
              <DisplayPanelContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">语音播报</p>
                    <p className="text-xs text-slate-600">结果出来后，是否用语音补一句。</p>
                  </div>
                  <Button
                    type="button"
                    variant={userSettings?.voicePlaybackEnabled ? 'default' : 'outline'}
                    className="rounded-full px-4 text-xs font-bold"
                    onClick={() =>
                      updateSettings(
                        userSettings,
                        { voicePlaybackEnabled: !userSettings?.voicePlaybackEnabled },
                        saveUserSettingsMutation.mutate,
                      )
                    }
                  >
                    {userSettings?.voicePlaybackEnabled ? '已开启' : '已关闭'}
                  </Button>
                </div>
              </DisplayPanelContent>
            </DisplayPanel>
          </DisplayPanelContent>
        </DisplayPanel>
      </div>

      <DisplayPanel className="rounded-[2.4rem] border-white/90 bg-white/94 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <DisplayPanelHeader className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_14px_28px_rgba(16,185,129,0.18)]">
                <Package2 className="h-5 w-5" />
              </span>
              <div>
                <DisplayPanelTitle className="text-2xl text-slate-950">我的工具</DisplayPanelTitle>
                <DisplayPanelDescription>
                  收藏、常用和以后还会再打开的工具，都放在这里。
                </DisplayPanelDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                nativeButton={false}
                render={<a href="/analyse" />}
                className="rounded-full px-4 text-xs font-bold"
              >
                {PAGE_COPY.pocket.backToAnalysisAction}
              </Button>
              <Button
                nativeButton={false}
                render={<a href="/market" />}
                variant="outline"
                className="rounded-full px-4 text-xs font-bold"
              >
                {PAGE_COPY.pocket.goMarketAction}
              </Button>
            </div>
          </div>
        </DisplayPanelHeader>
        <DisplayPanelContent className="space-y-6">
          {pocketInventory.length === 0 ? (
            <DisplayPanel className="rounded-[1.8rem] border-dashed border-slate-200 bg-slate-50/80 shadow-none">
              <DisplayPanelContent className="space-y-2 p-6 text-center">
                <p className="text-xl font-black text-slate-950">{PAGE_COPY.pocket.emptyTitle}</p>
                <p className="text-sm text-slate-600">{PAGE_COPY.pocket.emptyDescription}</p>
              </DisplayPanelContent>
            </DisplayPanel>
          ) : null}

          {pinnedTools.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                {PAGE_COPY.pocket.pinnedSection}
              </h3>
              <div className="grid gap-3 lg:grid-cols-2">
                {pinnedTools.map((item) => {
                  const tool = getToolById(item.toolId)
                  const href = resolveToolHref(item.toolId)
                  return (
                    <DisplayPanel key={item.toolId} className="rounded-[1.8rem] bg-white shadow-sm">
                      <DisplayPanelContent className="space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-black text-slate-950">
                              {tool?.name ?? item.toolId}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {tool?.description ?? '这是你收进口袋的工具入口。'}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            {PAGE_COPY.pocket.pinnedBadge}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>收进时间 {formatTime(item.savedAt)}</span>
                          <span>使用 {item.useCount} 次</span>
                          {item.purchased ? <span>{PAGE_COPY.pocket.purchasedBadge}</span> : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            nativeButton={false}
                            render={
                              <a
                                href={href}
                                target={href.startsWith('http') ? '_blank' : undefined}
                              />
                            }
                            className="rounded-full px-4 text-xs font-bold"
                            onClick={() => markToolUsedMutation.mutate({ toolId: item.toolId })}
                          >
                            打开
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full px-4 text-xs font-bold"
                            onClick={() => togglePinMutation.mutate({ toolId: item.toolId })}
                          >
                            {PAGE_COPY.pocket.unpinAction}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full px-4 text-xs font-bold"
                            onClick={() => togglePurchasedMutation.mutate({ toolId: item.toolId })}
                          >
                            {item.purchased
                              ? PAGE_COPY.pocket.unmarkPurchasedAction
                              : PAGE_COPY.pocket.markPurchasedAction}
                          </Button>
                        </div>
                      </DisplayPanelContent>
                    </DisplayPanel>
                  )
                })}
              </div>
            </section>
          ) : null}

          {regularTools.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                {PAGE_COPY.pocket.collectionSection}
              </h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {regularTools.map((item) => {
                  const tool = getToolById(item.toolId)
                  const href = resolveToolHref(item.toolId)
                  return (
                    <DisplayPanel key={item.toolId} className="rounded-[1.6rem] bg-white shadow-sm">
                      <DisplayPanelContent className="space-y-3 p-5">
                        <div>
                          <p className="text-base font-black text-slate-950">
                            {tool?.name ?? item.toolId}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {tool?.description ?? '这是你以后可能还会再打开的工具。'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          <span>收进时间 {formatTime(item.savedAt)}</span>
                          <span>使用 {item.useCount} 次</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            nativeButton={false}
                            render={
                              <a
                                href={href}
                                target={href.startsWith('http') ? '_blank' : undefined}
                              />
                            }
                            className="rounded-full px-4 text-xs font-bold"
                            onClick={() => markToolUsedMutation.mutate({ toolId: item.toolId })}
                          >
                            打开
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full px-4 text-xs font-bold"
                            onClick={() => togglePinMutation.mutate({ toolId: item.toolId })}
                          >
                            <Pin className="h-3.5 w-3.5" />
                            {PAGE_COPY.pocket.pinAction}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full px-4 text-xs font-bold"
                            onClick={() => toggleArchiveMutation.mutate({ toolId: item.toolId })}
                          >
                            <Archive className="h-3.5 w-3.5" />
                            {PAGE_COPY.pocket.archiveAction}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full px-4 text-xs font-bold text-rose-600 hover:text-rose-700"
                            onClick={() => removeToolMutation.mutate({ toolId: item.toolId })}
                          >
                            {PAGE_COPY.pocket.removeAction}
                          </Button>
                        </div>
                      </DisplayPanelContent>
                    </DisplayPanel>
                  )
                })}
              </div>
            </section>
          ) : null}

          {archivedTools.length > 0 ? (
            <section className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                {PAGE_COPY.pocket.archivedSection}
              </h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {archivedTools.map((item) => {
                  const tool = getToolById(item.toolId)
                  return (
                    <DisplayPanel
                      key={item.toolId}
                      className={cn('rounded-[1.6rem] bg-slate-50/80 shadow-none')}
                    >
                      <DisplayPanelContent className="space-y-3 p-5">
                        <div>
                          <p className="text-base font-black text-slate-900">
                            {tool?.name ?? item.toolId}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            已归档，不再优先出现在你的工具列表里。
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full px-4 text-xs font-bold"
                            onClick={() => toggleArchiveMutation.mutate({ toolId: item.toolId })}
                          >
                            {PAGE_COPY.pocket.unarchiveAction}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full px-4 text-xs font-bold text-rose-600 hover:text-rose-700"
                            onClick={() => removeToolMutation.mutate({ toolId: item.toolId })}
                          >
                            {PAGE_COPY.pocket.removeAction}
                          </Button>
                        </div>
                      </DisplayPanelContent>
                    </DisplayPanel>
                  )
                })}
              </div>
            </section>
          ) : null}
        </DisplayPanelContent>
      </DisplayPanel>
    </PageShell>
  )
}
