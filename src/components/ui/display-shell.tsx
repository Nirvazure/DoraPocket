import type { HTMLAttributes } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

function DisplayPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Card className={cn('dp-glass-panel border-0 shadow-none', className)} {...props} />
}

function DisplayPanelHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <CardHeader className={cn('space-y-2 p-5 sm:p-6', className)} {...props} />
}

function DisplayPanelTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <CardTitle className={cn('font-black tracking-tight text-foreground', className)} {...props} />
  )
}

function DisplayPanelDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <CardDescription className={cn('leading-7 text-muted-foreground', className)} {...props} />
}

function DisplayPanelContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <CardContent className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
}

function DisplayPanelFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <CardFooter className={cn('p-5 pt-0 sm:p-6 sm:pt-0', className)} {...props} />
}

export {
  DisplayPanel,
  DisplayPanelHeader,
  DisplayPanelTitle,
  DisplayPanelDescription,
  DisplayPanelContent,
  DisplayPanelFooter,
}
