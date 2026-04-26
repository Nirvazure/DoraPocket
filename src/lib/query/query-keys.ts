export const queryKeys = {
  userProfile: {
    all: ['userProfile'] as const,
    current: () => ['userProfile', 'current'] as const,
  },
  pocket: {
    all: ['pocket'] as const,
    list: () => ['pocket', 'list'] as const,
  },
  marketFeedback: {
    all: ['marketFeedback'] as const,
    list: () => ['marketFeedback', 'list'] as const,
  },
  marketSubscriptions: {
    all: ['marketSubscriptions'] as const,
    list: () => ['marketSubscriptions', 'list'] as const,
  },
  marketSubmissions: {
    all: ['marketSubmissions'] as const,
    list: () => ['marketSubmissions', 'list'] as const,
  },
  preferenceProfile: {
    all: ['preferenceProfile'] as const,
    current: (mode: 'applied' | 'inferred' = 'applied') => ['preferenceProfile', mode] as const,
  },
  marketContext: {
    all: ['marketContext'] as const,
    current: (mode: 'applied' | 'inferred' = 'applied') => ['marketContext', mode] as const,
  },
  marketActivity: {
    all: ['marketActivity'] as const,
    list: (limit: number) => ['marketActivity', 'list', limit] as const,
  },
  chatHistory: {
    all: ['chatHistory'] as const,
    list: () => ['chatHistory', 'list'] as const,
  },
  preferenceProfileOverride: {
    all: ['preferenceProfileOverride'] as const,
    current: () => ['preferenceProfileOverride', 'current'] as const,
  },
} as const
