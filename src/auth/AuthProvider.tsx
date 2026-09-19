import { useCallback, useEffect, useMemo, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"
import { getMe, login as loginRequest, type Session, type User } from "@/lib/authApi"
import { loadSession, msUntilExpiry, saveSession } from "@/lib/session"
import { AuthContext, type AuthState } from "./AuthContext"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(!!session)

  const logout = useCallback(() => {
    saveSession(null)
    setSession(null)
    setUser(null)
  }, [])

  // Load profile whenever the token changes. Also validates a stored token.
  useEffect(() => {
    if (!session) return
    let cancelled = false
    getMe(session.accessToken)
      .then((u) => !cancelled && setUser(u))
      .catch(() => !cancelled && logout())
      .finally(() => !cancelled && setIsLoading(false))
    return () => {
      cancelled = true
    }
  }, [session, logout])

  // No refresh token: log out when the token expires.
  useEffect(() => {
    if (!session) return
    const t = setTimeout(logout, Math.max(msUntilExpiry(session), 0))
    return () => clearTimeout(t)
  }, [session, logout])

  const login = useCallback(async (email: string, password: string) => {
    const s = await loginRequest(email, password)
    saveSession(s)
    setIsLoading(true)
    setSession(s)
  }, [])

  const authFetch = useCallback(
    async <T,>(path: string, init: RequestInit = {}) => {
      try {
        return await apiFetch<T>(path, {
          ...init,
          headers: { ...init.headers, Authorization: `Bearer ${session?.accessToken}` },
        })
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) logout()
        throw e
      }
    },
    [session, logout],
  )

  const value = useMemo<AuthState>(
    () => ({ user, isLoading, login, logout, authFetch }),
    [user, isLoading, login, logout, authFetch],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
