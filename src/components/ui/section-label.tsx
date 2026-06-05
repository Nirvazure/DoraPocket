import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionLabelProps = {
  children: ReactNode
  className?: string
}

/** 区块小标签：sentence case，不用 uppercase tracking eyebrow 样式 */
export function SectionLabel({ children, className }: SectionLabelProps) {
  return <p className={cn('text-xs font-semibold text-primary', className)}>{children}</p>
}
