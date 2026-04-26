import { useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AssistantModeCard } from '@/shared/mode-registry'
import { modeImageSrc } from '@/shared/mode-registry'
import { resolveToolUrlById } from '@/services/tool-registry'

type PocketGadgetModalProps = {
  open: boolean
  gadget: AssistantModeCard | null
  onClose: () => void
  onSaveToPocket?: (gadget: AssistantModeCard) => void
  onOpenTool?: (toolId: string) => void
}

export function PocketGadgetModal({ open, gadget, onClose, onSaveToPocket, onOpenTool }: PocketGadgetModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !gadget) return null

  const openAction = () => {
    if (!gadget.toolId) return
    onOpenTool?.(gadget.toolId)
  }

  const imageSrc = modeImageSrc(gadget)
  const canOpenExternal = resolveToolUrlById(gadget.toolId) != null

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-hidden />
      <Card
        data-dorapocket-ui
        role="dialog"
        aria-modal="true"
        aria-labelledby="pocket-gadget-title"
        className="dp-pocket-surface relative z-[1] w-full max-w-md overflow-hidden border-2 border-primary/35 shadow-lg"
      >
        <CardHeader className="space-y-1 pb-2">
          <p className="dp-pocket-heading text-[0.65rem] uppercase tracking-widest text-primary/90">四次元口袋</p>
          <CardTitle id="pocket-gadget-title" className="font-sans text-2xl font-black tracking-tight text-primary drop-shadow-sm">
            {gadget.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4 pt-0">
          <div className="overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-b from-primary/[0.07] via-muted/40 to-muted/25">
            <Image
              src={imageSrc}
              alt={gadget.title}
              width={400}
              height={400}
              className="mx-auto aspect-square w-full max-h-[min(16rem,52vw)] object-contain p-4 sm:max-h-[17.5rem] sm:p-5"
            />
          </div>
          <p className="rounded-2xl border-2 border-dashed border-primary/20 bg-background/85 px-4 py-3 font-sans text-sm leading-relaxed text-foreground">
            {gadget.description}
          </p>
        </CardContent>
        <div className="flex flex-col gap-2 border-t border-primary/10 p-6 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full border-2 border-primary/25 font-semibold sm:w-auto"
              onClick={onClose}
            >
              先收起
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full rounded-full border-2 border-primary/25 font-semibold sm:w-auto"
              onClick={() => onSaveToPocket?.(gadget)}
            >
              收入口袋
            </Button>
            <Button
              type="button"
              className="w-full rounded-full border-2 border-primary/25 bg-primary font-bold text-primary-foreground shadow-md sm:w-auto"
              onClick={openAction}
              disabled={!canOpenExternal}
            >
              {canOpenExternal ? '打开工具' : '这是一个内置模式'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
