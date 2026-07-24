/**
 * Shared helpers for detecting expired / invalid vendor sessions
 * so API callers can redirect to login instead of leaving the user stuck.
 */

const SESSION_ERROR_PATTERNS = [
  /invalid session/i,
  /expired session/i,
  /session (has )?expired/i,
  /invalid or expired session/i,
  /authentication required/i,
  /authentication failed/i,
  /please log (out|in)/i,
  /no session/i,
  /missing besmart auth token/i,
]

export function isSessionAuthError(status, message = '') {
  if (status === 401 || status === 403) return true
  if (!message) return false
  return SESSION_ERROR_PATTERNS.some((pattern) => pattern.test(String(message)))
}

export function getSessionErrorMessage(fallback = 'Your session has expired. Please log in again.') {
  return fallback
}
