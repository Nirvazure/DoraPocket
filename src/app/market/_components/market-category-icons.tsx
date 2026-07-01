import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  Briefcase,
  Code2,
  FolderHeart,
  GraduationCap,
  Image as ImageIcon,
  Palette,
  PenSquare,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ToolCategory } from '@/shared/market/tool-registry'

export type MarketCategoryKey = 'pocket' | ToolCategory

const CATEGORY_ICON_MAP: Record<MarketCategoryKey, LucideIcon> = {
  pocket: FolderHeart,
  ai_assistant: Bot,
  search: Search,
  developer: Code2,
  design: Palette,
  productivity: Briefcase,
  media: ImageIcon,
  learning: GraduationCap,
  writing: PenSquare,
}

type MarketCategoryIconProps = {
  category: MarketCategoryKey
  className?: string
}

export function MarketCategoryIcon({ category, className }: MarketCategoryIconProps) {
  const Icon = CATEGORY_ICON_MAP[category]
  return <Icon className={cn('h-4 w-4', className)} />
}
