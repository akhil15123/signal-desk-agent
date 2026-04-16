import type { AgentResult, BriefRequest } from './types'

type RunMode = 'live' | 'demo'

export async function requestBrief(
  draft: BriefRequest,
  mode: RunMode,
): Promise<AgentResult> {
  const endpoint = mode === 'live' ? '/api/brief' : '/api/demo'
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(draft),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.error ?? 'The briefing request failed.')
  }

  return payload as AgentResult
}
