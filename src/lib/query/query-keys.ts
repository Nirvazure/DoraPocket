export const queryKeys = {
  userSettings: {
    all: ['userSettings'] as const,
    current: (userId?: string) => ['userSettings', 'current', userId ?? null] as const,
  },
  pocket: {
    all: ['pocket'] as const,
    list: (userId?: string) => ['pocket', 'list', userId ?? null] as const,
  },
  marketReviewAggregates: {
    all: ['marketReviewAggregates'] as const,
    list: (userId?: string) => ['marketReviewAggregates', 'list', userId ?? null] as const,
  },
  marketTools: {
    all: ['marketTools'] as const,
    search: (query: string, userId?: string) => ['marketTools', query, userId ?? null] as const,
    byIds: (ids: string[], userId?: string) =>
      ['marketTools', 'byIds', [...ids].sort().join(','), userId ?? null] as const,
  },
  recommendationEvaluations: {
    all: ['recommendationEvaluations'] as const,
  },
} as const
