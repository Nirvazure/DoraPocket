import { useState } from 'react'
import { ChevronDown, ChevronUp, FileStack } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface ConversationPanelProps {
  transcript: string
  botResponse: string
  lastSpeechError: string
  perfSummary?: string | null
  className?: string
  bodyClassName?: string
  showHeader?: boolean
}

export function ConversationPanel({
  transcript,
  botResponse,
  lastSpeechError,
  perfSummary,
  className,
  bodyClassName,
  showHeader = true,
}: ConversationPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <section className={cn('overflow-hidden rounded-3xl border border-border/55 bg-white/92 shadow-sm backdrop-blur-md', className)}>
      {showHeader ? (
        <div className="flex items-center justify-between gap-3 border-b border-border/45 px-4 py-3">
            <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-primary">
              <FileStack className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground">记录抽屉</p>
              <p className="text-[11px] text-muted-foreground">默认静默；只有需要时才展开查看</p>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" className="h-8 rounded-full px-3 text-[11px]" onClick={() => setOpen((value) => !value)}>
            {open ? <ChevronUp className="mr-1 h-3.5 w-3.5" /> : <ChevronDown className="mr-1 h-3.5 w-3.5" />}
            {open ? '收起' : '展开'}
          </Button>
        </div>
      ) : null}

      <div className={cn('px-4 py-3', bodyClassName)}>
        {lastSpeechError ? (
          <div role="alert" className="rounded-2xl border border-destructive/25 bg-destructive/[0.06] px-3 py-2 text-xs font-medium leading-relaxed text-destructive">
            {lastSpeechError}
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-muted-foreground">结果已经在主工作区给出；这里仅保留辅助记录。</p>
        )}

        {open ? (
          <ScrollArea className="mt-3 max-h-[32vh] rounded-2xl border border-border/45 bg-slate-50 pr-2 [scrollbar-width:thin]">
            <div className="space-y-3 p-3 text-xs leading-relaxed">
              <div className="rounded-2xl border border-border/45 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">你的任务</p>
                <p className="mt-1 whitespace-pre-wrap text-foreground">{transcript.trim() || '—'}</p>
              </div>
              <div className="rounded-2xl border border-border/45 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">系统反馈</p>
                <p className="mt-1 whitespace-pre-wrap text-foreground">{botResponse.trim() || '—'}</p>
              </div>
              {perfSummary ? (
                <div className="rounded-2xl border border-border/45 bg-white p-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">性能概览</p>
                  <p className="mt-1 whitespace-pre-wrap text-foreground">{perfSummary}</p>
                </div>
              ) : null}
            </div>
          </ScrollArea>
        ) : null}
      </div>
    </section>
  )
}
