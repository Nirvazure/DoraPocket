'use client'

import dynamic from 'next/dynamic'
import { useState, type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/query-client'

const ReactQueryDevtoolsClient = dynamic(
  () =>
    import('@/components/providers/react-query-devtools-client').then(
      (module) => module.ReactQueryDevtoolsClient,
    ),
  { ssr: false },
)

type QueryProviderProps = {
  children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(() => getQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtoolsClient />
    </QueryClientProvider>
  )
}
