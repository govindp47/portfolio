/**
 * Defensive sessionStorage helpers.
 * Wrapped in try-catch for environments where sessionStorage is unavailable
 * (e.g. private browsing with strict settings, sandboxed iframes).
 */

export function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Silently fail — non-critical persistence
  }
}

export function clearSession(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Silently fail
  }
}