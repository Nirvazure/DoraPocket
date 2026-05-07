'use client'

import { ArrowRight, History, Settings2, SlidersHorizontal, UserRound } from 'lucide-react'
import { PageShell } from '@/components/common/page-shell'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
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

const PROFILE_DIRECTIONS = [
  {
    title: '画像校准',
    body: '后续允许你修正系统对价格、平台、注册门槛和工具类型的判断。',
    Icon: SlidersHorizontal,
  },
  {
    title: '历史回流',
    body: '把真正打开、保存、复用过的帮助路径带回下一次推荐。',
    Icon: History,
  },
  {
    title: '体验控制',
    body: '管理播报、记忆和解释详细度，让系统更安静也更可控。',
    Icon: Settings2,
  },
] as const

export function ProfilePage() {
  const { data: authSession } = useAuthSessionQuery()
  const isAuthenticated = authSession?.authenticated === true

  return (
    <PageShell
      contentClassName="pb-8 pt-4 sm:pt-5 lg:pt-6"
      header={
        <UnifiedTopBar
          title="个人中心"
          subtitle="个人画像与历史回流正在建设中。"
          rightSlot={
            <div className="flex items-center gap-2">
              <TopNavSwitch current="profile" />
              <ProfileEntryPill active />
            </div>
          }
        />
      }
    >
      <DisplayPanel className="overflow-hidden rounded-[2.4rem] border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,251,255,0.94)_48%,rgba(235,242,252,0.92)_100%)] shadow-[0_28px_86px_rgba(15,23,42,0.10)]">
        <DisplayPanelHeader className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">
              待开发
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <UserRound className="h-3.5 w-3.5" />
              {isAuthenticated ? '已登录，暂不展示复杂画像' : '登录后未来用于同步资产和偏好'}
            </span>
          </div>

          <div className="max-w-4xl space-y-4">
            <DisplayPanelTitle className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
              {isAuthenticated ? '画像与历史回流正在建设中。' : '个人中心先保留入口。'}
            </DisplayPanelTitle>
            <DisplayPanelDescription className="max-w-2xl text-base leading-8 text-slate-650">
              {isAuthenticated
                ? '当前不会把未成熟画像包装成最终能力。后续这里会承接偏好校准、历史回流和体验控制。'
                : '登录后，未来会用于同步口袋、历史与偏好。当前阶段先把主裁决体验打稳。'}
            </DisplayPanelDescription>
          </div>
        </DisplayPanelHeader>

        <DisplayPanelContent className="grid gap-4 border-t border-slate-200/70 bg-white/48 p-6 sm:p-8 lg:grid-cols-3">
          {PROFILE_DIRECTIONS.map(({ title, body, Icon }) => (
            <DisplayPanel
              key={title}
              className="rounded-[1.7rem] border-white/90 bg-white/84 p-5 shadow-sm"
            >
              <DisplayPanelHeader className="space-y-3 p-0">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.16)]">
                  <Icon className="h-5 w-5" />
                </span>
                <DisplayPanelTitle className="text-lg text-slate-950">{title}</DisplayPanelTitle>
                <DisplayPanelDescription className="text-sm leading-7 text-slate-600">
                  {body}
                </DisplayPanelDescription>
              </DisplayPanelHeader>
            </DisplayPanel>
          ))}
        </DisplayPanelContent>
      </DisplayPanel>

      <div className="flex flex-wrap gap-3">
        {!isAuthenticated ? (
          <Button
            nativeButton={false}
            render={<a href="/login" />}
            className="h-11 rounded-full px-5 text-sm font-black"
          >
            登录并保留未来同步入口
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          nativeButton={false}
          render={<a href="/analyse" />}
          className="h-11 rounded-full px-5 text-sm font-black"
          variant={isAuthenticated ? 'default' : 'outline'}
        >
          回到分析页
        </Button>
        {isAuthenticated ? (
          <Button
            nativeButton={false}
            render={<a href="/market" />}
            variant="outline"
            className="h-11 rounded-full bg-white/86 px-5 text-sm font-bold"
          >
            去市场补充反馈
          </Button>
        ) : null}
      </div>
    </PageShell>
  )
}
