type JsonParseError = SyntaxError & {
  status?: number
  type?: string
}

export function isJsonParseError(error: unknown): error is JsonParseError {
  return (
    error instanceof SyntaxError &&
    (error as JsonParseError).status === 400 &&
    (error as JsonParseError).type === 'entity.parse.failed'
  )
}
