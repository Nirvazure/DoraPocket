'use client'

import { ArrowRight, Archive, History, RotateCcw } from 'lucide-react'
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
import { PAGE_COPY } from '@/shared/ui-copy'

const POCKET_DIRECTIONS = [
  {
    title: '沉淀有效帮助',
    body: '只保存这次真的帮上忙的工具、入口和使用线索，而不是堆普通收藏。',
    Icon: Archive,
  },
  {
    title: '复用历史路径',
    body: '下次遇到相似任务时，从已验证路径重新启动，减少重复比较。',
    Icon: History,
  },
  {
    title: '回流推荐判断',
    body: '打开、保存、复用和跳过会逐步变成下一次裁决的信号。',
    Icon: RotateCcw,
  },
] as const

export function PocketPage() {
  return (
    <PageShell
      header={
        <UnifiedTopBar
          title={PAGE_COPY.pocket.title}
          subtitle="口袋入口保留，资产系统后续实现。"
          rightSlot={
            <div className="flex items-center gap-2">
              <TopNavSwitch current="pocket" />
              <ProfileEntryPill />
            </div>
          }
        />
      }
    >
      <DisplayPanel className="overflow-hidden rounded-[2.4rem] border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(239,248,255,0.94)_48%,rgba(224,242,254,0.9)_100%)] shadow-[0_28px_86px_rgba(14,165,233,0.12)]">
        <DisplayPanelHeader className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-sky-700">
              规划中
            </span>
            <span className="text-xs font-semibold text-slate-500">入口保留，复杂管理暂不开放</span>
          </div>
          <div className="max-w-4xl space-y-4">
            <DisplayPanelTitle className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
              口袋资产系统待实现。
            </DisplayPanelTitle>
            <DisplayPanelDescription className="max-w-2xl text-base leading-8 text-slate-650">
              这里不会先做成普通收藏夹。口袋后续要承接“这次真的有用的帮助”、可复用路径和推荐回流信号。
            </DisplayPanelDescription>
          </div>
        </DisplayPanelHeader>

        <DisplayPanelContent className="grid gap-4 border-t border-sky-100/70 bg-white/48 p-6 sm:p-8 lg:grid-cols-3">
          {POCKET_DIRECTIONS.map(({ title, body, Icon }) => (
            <DisplayPanel
              key={title}
              className="rounded-[1.7rem] border-white/90 bg-white/84 p-5 shadow-sm"
            >
              <DisplayPanelHeader className="space-y-3 p-0">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-[0_14px_28px_rgba(14,165,233,0.18)]">
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
        <Button
          nativeButton={false}
          render={<a href="/analyse" />}
          className="h-11 rounded-full px-5 text-sm font-black"
        >
          先去完成一次求助
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          nativeButton={false}
          render={<a href="/market" />}
          variant="outline"
          className="h-11 rounded-full bg-white/86 px-5 text-sm font-bold"
        >
          浏览工具市场
        </Button>
      </div>
    </PageShell>
  )
}
