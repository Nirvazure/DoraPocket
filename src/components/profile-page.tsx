'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { BadgeCheck, BrainCircuit, History, ShieldCheck, SlidersHorizontal, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/common/page-shell'
import { ProfileEntryPill } from '@/components/common/profile-entry-pill'
import { TopNavSwitch } from '@/components/common/top-nav-switch'
import { UnifiedTopBar } from '@/components/common/unified-top-bar'
import {
  buildMarketContext,
  getPreferenceCalibrationOptions,
  loadMarketFeedback,
  loadMarketSubscriptions,
  loadPreferenceProfileOverride,
  recentMarketActivity,
  resetPreferenceProfileOverride,
  savePreferenceProfileOverride,
} from '@/services/market-storage'
import { loadChatHistory, type ChatHistoryEntry } from '@/services/chat-history'
import { loadPocketInventory } from '@/services/pocket-inventory'
import { getToolById } from '@/services/tool-registry'
import type { PreferenceProfileOverride } from '@/shared/market-types'
import { loadUserProfile, readAvatarFile, saveUserProfile, subscribeUserProfile, type UserProfile } from '@/services/user-profile'

function preferenceLabel(value: string) {
  const preferenceLabelMap: Record<string, string> = {
    ai_assistant: 'AI 助手',
    search: '资料搜索',
    dev: '开发工具',
    design: '设计素材',
    productivity: '办公效率',
    media: '媒体处理',
    learning: '学习研究',
    writing: '写作整理',
    free: '免费优先',
    freemium: '可先试用',
    paid: '付费也可',
    subscription: '长期订阅',
    native_card: '站内小闭环',
    external_link: '外部工具',
    workflow: '流程方案',
    reference_only: '资料参考',
  }
  return preferenceLabelMap[value] ?? value
}

function formatTime(value: number) {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ProfilePage() {
  const [history, setHistory] = useState<ChatHistoryEntry[]>([])
  const [refreshToken, setRefreshToken] = useState(0)
  const [preferenceOverride, setPreferenceOverride] = useState<PreferenceProfileOverride>(() => loadPreferenceProfileOverride())
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile())
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHistory(loadChatHistory()))
    const unsubscribe = subscribeUserProfile(setProfile)
    return () => {
      window.cancelAnimationFrame(frame)
      unsubscribe()
    }
  }, [])

  const pocketInventory = useMemo(() => {
    void refreshToken
    return loadPocketInventory()
  }, [refreshToken])
  const archivedItems = pocketInventory.filter((item) => item.archived)
  const feedback = loadMarketFeedback()
  const subscriptions = loadMarketSubscriptions().filter((item) => item.active)
  const marketContext = buildMarketContext(pocketInventory)
  const activities = recentMarketActivity(6)
  const calibrationOptions = getPreferenceCalibrationOptions()
  const visibleActivities = activities.slice(0, 4)
  const visibleHistory = history.slice(0, 5)
  const profileSummary = marketContext.preferenceProfile.summary.length
    ? marketContext.preferenceProfile.summary
    : ['偏好画像还在建立中，先通过收藏、复用、反馈积累真实信号。']
  const profileFacts = [
    { label: '偏好分类', value: marketContext.preferenceProfile.preferredCategories.slice(0, 3).map(preferenceLabel).join(' / ') || '待学习' },
    { label: '偏好平台', value: marketContext.preferenceProfile.preferredPlatforms.slice(0, 2).join(' / ') || '待学习' },
    { label: '价格倾向', value: marketContext.preferenceProfile.preferredPricing.slice(0, 3).map(preferenceLabel).join(' / ') || '待学习' },
    { label: '订阅资产', value: `${subscriptions.length} 个` },
  ]

  const commitPreferenceOverride = (next: PreferenceProfileOverride) => {
    setPreferenceOverride(next)
    savePreferenceProfileOverride(next)
    setRefreshToken((value) => value + 1)
  }

  const toggleListValue = (key: 'preferredCategories' | 'preferredPricing' | 'preferredExecutionModes', value: string) => {
    const list = preferenceOverride[key] ?? []
    const nextList = list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
    commitPreferenceOverride({ ...preferenceOverride, [key]: nextList })
  }

  const setBooleanPreference = (key: 'avoidAuthWall' | 'prefersSubscriptionTools', value: boolean) => {
    commitPreferenceOverride({ ...preferenceOverride, [key]: value })
  }

  const resetCalibration = () => {
    resetPreferenceProfileOverride()
    setPreferenceOverride({})
    setRefreshToken((value) => value + 1)
  }

  const calibrationCount =
    (preferenceOverride.preferredCategories?.length ?? 0) +
    (preferenceOverride.preferredPricing?.length ?? 0) +
    (preferenceOverride.preferredExecutionModes?.length ?? 0) +
    Number(preferenceOverride.avoidAuthWall === true) +
    Number(preferenceOverride.prefersSubscriptionTools === true)

  const handlePickAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const avatarSrc = await readAvatarFile(file)
      const nextProfile = { ...profile, avatarSrc }
      setProfile(nextProfile)
      saveUserProfile(nextProfile)
    } catch {
      /* ignore */
    } finally {
      event.target.value = ''
    }
  }

  return (
    <PageShell
      header={
        <UnifiedTopBar
          title="DoraPocket · 个人中心"
          subtitle="管理头像、偏好、历史与回流信号，让系统更懂你。"
          rightSlot={
            <div className="flex items-center gap-2">
              <TopNavSwitch current="profile" />
              <ProfileEntryPill active />
            </div>
          }
        />
      }
    >
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePickAvatar} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(17.5rem,0.78fr)] xl:grid-cols-[minmax(0,1.68fr)_minmax(19rem,0.72fr)]">
        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-3 shadow-xl shadow-slate-900/8 backdrop-blur-xl sm:p-4">
          <div className="rounded-[1.65rem] border border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,247,255,0.96))] p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  <History className="h-3.5 w-3.5" />
                  个人时间流
                </p>
                <h2 className="mt-2 text-xl font-black text-foreground sm:text-[1.6rem]">最近哪些轨迹正在影响下一次裁决</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">左侧只保留你的主阅读带：先看回流，再看最近的对话回看。</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:min-w-[17rem]">
                {[
                  { label: '反馈', value: feedback.length },
                  { label: '订阅', value: subscriptions.length },
                  { label: '归档', value: archivedItems.length },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/80 bg-white/88 px-3 py-2.5 shadow-sm">
                    <p className="text-lg font-black leading-none text-primary">{item.value}</p>
                    <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
            <div className="rounded-[1.65rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  行为回流
                </div>
                <span className="rounded-full bg-primary/[0.08] px-2.5 py-1 text-[11px] font-semibold text-primary">
                  {visibleActivities.length} 条最近动作
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {visibleActivities.length > 0 ? (
                  visibleActivities.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-border/60 bg-white/88 px-3 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/12 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-foreground">{item.title}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{formatTime(item.createdAt)}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-white/80 p-6 text-center text-sm font-semibold text-muted-foreground">
                    暂无近期回流。打开、收藏、订阅、反馈都会在这里留下痕迹。
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[1.65rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  <History className="h-3.5 w-3.5" />
                  对话回看
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  {visibleHistory.length} 条最近记录
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {visibleHistory.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-white/80 p-6 text-center text-sm font-semibold text-muted-foreground">
                    暂无对话历史。完成一次分析后，完整问答会保存在这里。
                  </div>
                ) : (
                  visibleHistory.map((entry) => {
                    const tool = getToolById(entry.selectedToolId)
                    return (
                      <article key={entry.id} className="rounded-2xl border border-border/60 bg-white/88 px-3 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/12 hover:bg-white hover:shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="rounded-full bg-primary/[0.08] px-2 py-0.5 text-[11px] font-bold text-primary">{formatTime(entry.createdAt)}</p>
                          {tool ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{tool.name}</span> : null}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-black text-foreground">{entry.userText}</p>
                        <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{entry.assistantText}</p>
                      </article>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/92 p-3 shadow-xl shadow-slate-900/8 backdrop-blur-xl sm:p-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[1.65rem] border border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,247,255,0.96))] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  个人画像面板
                </p>
                <h2 className="mt-2 text-xl font-black text-foreground">系统现在如何理解你</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">右侧保留摘要和微调，不再展开成第二条重信息流。</p>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="mt-0.5 h-4.5 w-4.5 text-primary" />
                <Button type="button" variant="outline" className="h-8 rounded-full bg-white px-2.5 text-[11px] font-bold text-muted-foreground shadow-sm" onClick={resetCalibration}>
                  <Undo2 className="mr-1 h-3.5 w-3.5" />
                  {calibrationCount > 0 ? `重置 ${calibrationCount}` : '重置'}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[1.65rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/80 bg-slate-100 shadow-sm transition-transform hover:scale-[1.02]"
                aria-label="点击上传头像"
              >
                <Image src={profile.avatarSrc ?? '/branding/assistant-avatar.svg'} alt="个人头像" width={56} height={56} unoptimized className="h-full w-full object-cover" />
              </button>
              <div className="min-w-0">
                <p className="text-sm font-black text-foreground">{profile.nickname}</p>
                <p className="mt-1 text-xs text-muted-foreground">点头像可更新个人头像，下面的标签会直接影响下一次裁决。</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {profileSummary.map((item) => (
                <div key={item} className="rounded-2xl border border-border/60 bg-white/88 px-3 py-2.5 shadow-sm">
                  <p className="text-sm font-semibold text-foreground">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {profileFacts.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/60 bg-white px-3 py-2.5 shadow-sm">
                  <p className="text-[11px] font-bold text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-black text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-[1.65rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                优先任务类型
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {calibrationOptions.categories.map((category) => {
                  const active = preferenceOverride.preferredCategories?.includes(category)
                  return (
                    <button
                      key={category}
                      type="button"
                      className={active ? 'rounded-full border border-primary/15 bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-[0_10px_24px_rgba(37,99,235,0.18)]' : 'rounded-full border border-border/70 bg-white px-3 py-1.5 text-[11px] font-bold text-foreground/75 shadow-sm transition-colors hover:bg-slate-50'}
                      onClick={() => toggleListValue('preferredCategories', category)}
                    >
                      {preferenceLabel(category)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[1.65rem] border border-border/60 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98))] p-3 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                价格、摩擦和帮助形态
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {calibrationOptions.pricing.map((pricing) => {
                  const active = preferenceOverride.preferredPricing?.includes(pricing)
                  return (
                    <button
                      key={pricing}
                      type="button"
                      className={active ? 'rounded-full border border-primary/15 bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-[0_10px_24px_rgba(37,99,235,0.18)]' : 'rounded-full border border-border/70 bg-white px-3 py-1.5 text-[11px] font-bold text-foreground/75 shadow-sm transition-colors hover:bg-slate-50'}
                      onClick={() => toggleListValue('preferredPricing', pricing)}
                    >
                      {preferenceLabel(pricing)}
                    </button>
                  )
                })}
                {calibrationOptions.executionModes.map((mode) => {
                  const active = preferenceOverride.preferredExecutionModes?.includes(mode)
                  return (
                    <button
                      key={mode}
                      type="button"
                      className={active ? 'rounded-full border border-primary/15 bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-[0_10px_24px_rgba(37,99,235,0.18)]' : 'rounded-full border border-border/70 bg-white px-3 py-1.5 text-[11px] font-bold text-foreground/75 shadow-sm transition-colors hover:bg-slate-50'}
                      onClick={() => toggleListValue('preferredExecutionModes', mode)}
                    >
                      {preferenceLabel(mode)}
                    </button>
                  )
                })}
                <button
                  type="button"
                  className={preferenceOverride.avoidAuthWall === true ? 'rounded-full border border-emerald-500/20 bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_10px_24px_rgba(5,150,105,0.18)]' : 'rounded-full border border-border/70 bg-white px-3 py-1.5 text-[11px] font-bold text-foreground/75 shadow-sm transition-colors hover:bg-slate-50'}
                  onClick={() => setBooleanPreference('avoidAuthWall', preferenceOverride.avoidAuthWall !== true)}
                >
                  优先免登录
                </button>
                <button
                  type="button"
                  className={preferenceOverride.prefersSubscriptionTools === true ? 'rounded-full border border-emerald-500/20 bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_10px_24px_rgba(5,150,105,0.18)]' : 'rounded-full border border-border/70 bg-white px-3 py-1.5 text-[11px] font-bold text-foreground/75 shadow-sm transition-colors hover:bg-slate-50'}
                  onClick={() => setBooleanPreference('prefersSubscriptionTools', preferenceOverride.prefersSubscriptionTools !== true)}
                >
                  接受长期订阅
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
