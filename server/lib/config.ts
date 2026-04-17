const reasoningEfforts = ['low', 'medium', 'high'] as const

type ReasoningEffort = (typeof reasoningEfforts)[number]

function readPositiveInteger(name: string, fallback: number) {
  const value = process.env[name]

  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function readReasoningEffort(name: string, fallback: ReasoningEffort) {
  const value = process.env[name]

  if (!value) {
    return fallback
  }

  return reasoningEfforts.includes(value as ReasoningEffort)
    ? (value as ReasoningEffort)
    : fallback
}

export const agentConfig = Object.freeze({
  baseUrl: process.env.OPENAI_BASE_URL || undefined,
  model: process.env.OPENAI_MODEL ?? 'gpt-5-mini',
  maxRounds: readPositiveInteger('SIGNAL_DESK_MAX_AGENT_ROUNDS', 8),
  reasoningEffort: readReasoningEffort(
    'SIGNAL_DESK_REASONING_EFFORT',
    'medium',
  ),
})
