'use client'

import Image from 'next/image'
import { type ChangeEvent, type RefObject } from 'react'
import { BrainCircuit, ShieldCheck, SlidersHorizontal, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PreferenceProfileOverride } from '@/shared/market-types'
import type { ToolCategory, ToolExecutionMode, ToolPricingModel } from '@/shared/tool-registry'

type CalibrationOptions = {
  categories: ToolCategory[]
  pricing: ToolPricingModel[]
  executionModes: ToolExecutionMode[]
}

type ProfileFact = {
  label: string
  value: string
}

type ProfilePreferencePanelProps = {
  fileInputRef: RefObject<HTMLInputElement | null>
  onPickAvatar: (event: ChangeEvent<HTMLInputElement>) => void
  onReset: () => void
  calibrationCount: number
  profileAvatarSrc: string
  profileNickname: string
  profileSummary: string[]
  profileFacts: ProfileFact[]
  calibrationOptions: CalibrationOptions
  preferenceOverride: PreferenceProfileOverride
  preferenceLabel: (value: string) => string
  onToggleListValue: (
    key: 'preferredCategories' | 'preferredPricing' | 'preferredExecutionModes',
    value: ToolCategory | ToolPricingModel | ToolExecutionMode,
  ) => void
  onSetBooleanPreference: (key: 'avoidAuthWall' | 'prefersSubscriptionTools', value: boolean) => void
}

export function ProfilePreferencePanel({
  fileInputRef,
  onPickAvatar,
  onReset,
  calibrationCount,
  profileAvatarSrc,
  profileNickname,
  profileSummary,
  profileFacts,
  calibrationOptions,
  preferenceOverride,
  preferenceLabel,
  onToggleListValue,
  onSetBooleanPreference,
}: ProfilePreferencePanelProps) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/92 p-3 shadow-xl shadow-slate-900/8 backdrop-blur-xl sm:p-4 lg:sticky lg:top-24 lg:self-start">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />

      <div className="rounded-[1.65rem] border border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,247,255,0.96))] p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              <BrainCircuit className="h-3.5 w-3.5" />
              个人画像面板
            </p>
            <h2 className="mt-2 text-xl font-black text-foreground">系统现在如何理解你？</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">右侧保留摘要和微调，不再展开成第二条重信息流。</p>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="mt-0.5 h-4.5 w-4.5 text-primary" />
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-full bg-white px-2.5 text-[11px] font-bold text-muted-foreground shadow-sm"
              onClick={onReset}
            >
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
            <Image
              src={profileAvatarSrc}
              alt="个人头像"
              width={56}
              height={56}
              unoptimized
              className="h-full w-full object-cover"
            />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-black text-foreground">{profileNickname}</p>
            <p className="mt-1 text-xs text-muted-foreground">点击头像可更新个人头像，下面的标签会直接影响下一次裁决。</p>
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
                  onClick={() => onToggleListValue('preferredCategories', category)}
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
            价格、门槛与帮助形态
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {calibrationOptions.pricing.map((pricing) => {
              const active = preferenceOverride.preferredPricing?.includes(pricing)
              return (
                <button
                  key={pricing}
                  type="button"
                  className={active ? 'rounded-full border border-primary/15 bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-[0_10px_24px_rgba(37,99,235,0.18)]' : 'rounded-full border border-border/70 bg-white px-3 py-1.5 text-[11px] font-bold text-foreground/75 shadow-sm transition-colors hover:bg-slate-50'}
                  onClick={() => onToggleListValue('preferredPricing', pricing)}
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
                  onClick={() => onToggleListValue('preferredExecutionModes', mode)}
                >
                  {preferenceLabel(mode)}
                </button>
              )
            })}
            <button
              type="button"
              className={preferenceOverride.avoidAuthWall === true ? 'rounded-full border border-emerald-500/20 bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_10px_24px_rgba(5,150,105,0.18)]' : 'rounded-full border border-border/70 bg-white px-3 py-1.5 text-[11px] font-bold text-foreground/75 shadow-sm transition-colors hover:bg-slate-50'}
              onClick={() => onSetBooleanPreference('avoidAuthWall', preferenceOverride.avoidAuthWall !== true)}
            >
              优先免登录
            </button>
            <button
              type="button"
              className={preferenceOverride.prefersSubscriptionTools === true ? 'rounded-full border border-emerald-500/20 bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_10px_24px_rgba(5,150,105,0.18)]' : 'rounded-full border border-border/70 bg-white px-3 py-1.5 text-[11px] font-bold text-foreground/75 shadow-sm transition-colors hover:bg-slate-50'}
              onClick={() => onSetBooleanPreference('prefersSubscriptionTools', preferenceOverride.prefersSubscriptionTools !== true)}
            >
              接受长期订阅
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
