'use strict'

/**
 * Render an error as something actionable.
 *
 * Node reports a failed connection that tried several addresses as an
 * AggregateError whose own `message` is an empty string — the real cause sits
 * in `.errors`. `fetch` likewise hides the reason in `.cause`. Reading only
 * `.message` on either prints nothing, so unwrap both.
 */
function describeError(error, depth = 0) {
  if (!error) return 'unknown error'
  if (depth > 4) return String(error)

  const parts = []
  if (error.message) parts.push(error.message)

  if (Array.isArray(error.errors) && error.errors.length) {
    parts.push(error.errors.map((inner) => describeError(inner, depth + 1)).join('; '))
  } else if (error.cause) {
    parts.push(describeError(error.cause, depth + 1))
  }

  if (error.code && !parts.some((part) => part.includes(error.code))) parts.push(`(${error.code})`)
  if (error.address) parts.push(`at ${error.address}:${error.port ?? '?'}`)

  return parts.filter(Boolean).join(' ') || String(error)
}

module.exports = { describeError }
