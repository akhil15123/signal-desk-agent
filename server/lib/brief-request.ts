function normalizeInlineText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeParagraphText(value: string) {
  return value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => normalizeInlineText(line))
    .filter(Boolean)
    .join('\n')
}

export function normalizeBriefRequestPayload(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input
  }

  const payload = input as Record<string, unknown>

  return {
    ...payload,
    topic:
      typeof payload.topic === 'string'
        ? normalizeInlineText(payload.topic)
        : payload.topic,
    objective:
      typeof payload.objective === 'string'
        ? normalizeParagraphText(payload.objective)
        : payload.objective,
  }
}
