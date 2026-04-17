import type { AgentErrorPayload, AgentResult, BriefRequest } from './types'

type RunMode = 'live' | 'demo'

export class BriefRequestError extends Error {
  requestId?: string

  constructor(message: string, requestId?: string) {
    super(message)
    this.name = 'BriefRequestError'
    this.requestId = requestId
  }
}

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

  const payload = (await response.json().catch(() => null)) as
    | AgentResult
    | AgentErrorPayload
    | null

  if (!response.ok) {
    const requestId = payload?.requestId
    const message =
      payload && 'error' in payload
        ? payload.error
        : 'The briefing request failed.'

    throw new BriefRequestError(message, requestId)
  }

  return payload as AgentResult
}
