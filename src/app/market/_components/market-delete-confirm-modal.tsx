'use client'

import { Button } from '@/components/ui/button'
import {
  DisplayPanel,
  DisplayPanelContent,
  DisplayPanelHeader,
  DisplayPanelTitle,
} from '@/components/ui/display-shell'
import { PAGE_COPY } from '@/shared/copy/ui-copy'

type MarketDeleteConfirmModalProps = {
  open: boolean
  toolName?: string | null
  error?: string | null
  pending?: boolean
  onClose: () => void
  onConfirm: () => void
}

export function MarketDeleteConfirmModal({
  open,
  toolName,
  error,
  pending = false,
  onClose,
  onConfirm,
}: MarketDeleteConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <DisplayPanel className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-2xl">
        <DisplayPanelHeader className="p-0">
          <DisplayPanelTitle className="text-2xl">
            {PAGE_COPY.market.deleteOwnedAction}
          </DisplayPanelTitle>
        </DisplayPanelHeader>
        <DisplayPanelContent className="mt-4 space-y-3 p-0">
          <p className="text-sm leading-6 text-muted-foreground">
            {PAGE_COPY.market.deleteOwnedConfirm}
          </p>
          {toolName ? (
            <p className="truncate text-sm font-semibold text-foreground" title={toolName}>
              {toolName}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </DisplayPanelContent>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full px-4"
            disabled={pending}
            onClick={onClose}
          >
            {PAGE_COPY.market.deleteOwnedCancelAction}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="h-10 rounded-full px-4"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending
              ? PAGE_COPY.market.deleteOwnedPending
              : PAGE_COPY.market.deleteOwnedConfirmAction}
          </Button>
        </div>
      </DisplayPanel>
    </div>
  )
}
