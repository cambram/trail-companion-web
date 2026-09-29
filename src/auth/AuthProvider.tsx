import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { ApiError, apiFetch } from "@/lib/api"
import {
  login as loginRequest,
  logout as logoutRequest,
  refresh as refreshRequest,
  type Session,
  type User,
} from "@/lib/authApi"
import { loadSession, msUntilExpiry, saveSession } from "@/lib/session"
import { AuthContext, type AuthState } from "./AuthContext"

const REFRESH_BEFORE_EXPIRY_MS = 60_000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const sessionRef = useRef(session)
  const refreshing = useRef<Promise<Session | null> | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(!!session)

  const apply = useCallback((s: Session | null) => {
    sessionRef.current = s
    saveSession(s)
    setSession(s)
    if (!s) setUser(null)
  }, [])

  // Every caller shares one in-flight refresh: presenting a rotated cookie twice revokes the whole session.
  // Only a 401 ends the session; offline or 429 keeps it so a later call can try again.
  const refresh = useCallback(() => {
    refreshing.current ??= refreshRequest()
      .then((s) => {
        apply(s)
        return s
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) apply(null)
        return null
      })
      .finally(() => {
        refreshing.current = null
      })
    return refreshing.current
  }, [apply])

  const authFetch = useCallback(
    async <T,>(path: string, init: RequestInit = {}) => {
      const send = (s: Session | null) =>
        apiFetch<T>(path, { ...init, headers: { ...init.headers, Authorization: `Bearer ${s?.accessToken}` } })

      let sent = sessionRef.current
      if (sent && msUntilExpiry(sent) <= 0) sent = await refresh()
      try {
        return await send(sent)
      } catch (e) {
        // A 401 with ProblemDetails is a rejected credential (e.g. wrong current password), not an expired token.
        if (!(e instanceof ApiError && e.status === 401 && !e.problem)) throw e
        // Another request may already have refreshed; otherwise refresh once and retry once.
        const next = sessionRef.current !== sent ? sessionRef.current : await refresh()
        if (!next) throw e
        return send(next)
      }
    },
    [refresh],
  )

  const loadUser = useCallback(() => authFetch<User>("/api/users/me").then(setUser), [authFetch])

  // Boot: a stored (possibly expired) session is validated, refreshed via the cookie if needed.
  useEffect(() => {
    if (!sessionRef.current) return
    loadUser()
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [loadUser])

  useEffect(() => {
    if (!session) return
    const t = setTimeout(refresh, Math.max(msUntilExpiry(session) - REFRESH_BEFORE_EXPIRY_MS, 0))
    return () => clearTimeout(t)
  }, [session, refresh])

  const login = useCallback(
    async (email: string, password: string) => {
      apply(await loginRequest(email, password))
      await loadUser()
    },
    [apply, loadUser],
  )

  const logout = useCallback(async () => {
    await logoutRequest().catch(() => {})
    apply(null)
  }, [apply])

  const value = useMemo<AuthState>(
    () => ({ user, isLoading, login, logout, authFetch, setUser }),
    [user, isLoading, login, logout, authFetch],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
