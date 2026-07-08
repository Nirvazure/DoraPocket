import type { Metadata } from 'next'
import { AnalysisPageClient } from './analysis-page-client'
import { PAGE_COPY } from '@/shared/copy/ui-copy'

export const metadata: Metadata = {
  title: '分析 | DoraPocket',
  description: PAGE_COPY.analysis.subtitle,
}

export default function AnalyseRoutePage() {
  return <AnalysisPageClient />
}
