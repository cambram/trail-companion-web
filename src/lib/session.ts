import type { Session } from "@/lib/authApi"

const KEY = "session"
// Treat the token as expired slightly before server expiry; do not rely on server clock-skew tolerance.
const MARGIN_MS = 10_000

export const msUntilExpiry = (s: Session) => Date.parse(s.expiresAtUtc) - Date.now() - MARGIN_MS

// ponytail: localStorage survives reloads but is XSS-readable. Swap to in-memory if that matters.
// Holds only the access token; the refresh token lives in an httpOnly cookie and must never be stored here.
// An expired session is still returned: AuthProvider refreshes it via the cookie.
export const loadSession = (): Session | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null") as Session | null
  } catch {
    return null
  }
}

export const saveSession = (s: Session | null) => {
  try {
    if (s) localStorage.setItem(KEY, JSON.stringify(s))
    else localStorage.removeItem(KEY)
  } catch {
    // storage unavailable: session lives in memory only
  }
}
