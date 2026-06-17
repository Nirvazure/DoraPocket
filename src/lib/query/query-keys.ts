export const queryKeys = {
  userSettings: {
    all: ['userSettings'] as const,
    current: () => ['userSettings', 'current'] as const,
  },
  pocket: {
    all: ['pocket'] as const,
    list: () => ['pocket', 'list'] as const,
  },
  marketReviewAggregates: {
    all: ['marketReviewAggregates'] as const,
    list: () => ['marketReviewAggregates', 'list'] as const,
  },
  marketTools: {
    all: ['marketTools'] as const,
    search: (query: string) => ['marketTools', query] as const,
    byIds: (ids: string[]) => ['marketTools', 'byIds', [...ids].sort().join(',')] as const,
  },
  recommendationEvaluations: {
    all: ['recommendationEvaluations'] as const,
  },
} as const
