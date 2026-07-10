import {
  inferStarterIntakeFromText,
  normalizeStarterIntakeDraft,
  type StarterIntakeDraft,
} from '@/shared/discovery/starter-intake'

type StarterIntentResponse = {
  draft?: unknown
  source?: 'model' | 'fallback'
  warning?: string
}

export async function analyseStarterIntent(text: string): Promise<StarterIntakeDraft> {
  const safeText = text.trim()
  if (!safeText) {
    return inferStarterIntakeFromText('')
  }

  try {
    const response = await fetch('/api/analyse/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: safeText }),
    })

    if (!response.ok) {
      throw new Error(`intent api failed: ${response.status}`)
    }

    const body = (await response.json()) as StarterIntentResponse
    return normalizeStarterIntakeDraft(body.draft, safeText, body.source ?? 'model')
  } catch {
    return inferStarterIntakeFromText(safeText)
  }
}
