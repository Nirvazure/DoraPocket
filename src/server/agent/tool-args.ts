type ModelToolCallArgs = Record<string, unknown> | string | undefined

export function normalizeArgs(value: ModelToolCallArgs): Record<string, unknown> {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }
  return value
}

export function normalizeToolArgs(
  toolId: string,
  args: Record<string, unknown>,
): Record<string, unknown> {
  if (toolId === 'weather' || toolId === 'air_quality') {
    const location =
      typeof args.location === 'string' && args.location.trim() ? args.location.trim() : '上海'
    return { location }
  }
  if (toolId === 'exchange_rate') {
    const from =
      typeof args.from === 'string' && args.from.trim() ? args.from.trim().toUpperCase() : 'USD'
    const to =
      typeof args.to === 'string' && args.to.trim() ? args.to.trim().toUpperCase() : 'CNY'
    const amount =
      typeof args.amount === 'number' && Number.isFinite(args.amount) && args.amount > 0
        ? args.amount
        : 1
    return { from, to, amount }
  }
  if (toolId === 'web_summary') {
    const url = typeof args.url === 'string' ? args.url.trim() : ''
    return { url }
  }
  return {}
}
