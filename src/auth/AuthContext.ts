import { createContext, useContext } from "react"

import type { User } from "@/lib/authApi"

export type AuthState = {
  user: User | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  /** Revokes the refresh cookie on the server, then clears local state. */
  logout: () => Promise<void>
  /** Call a protected route: attaches bearer; on an expired-token 401 refreshes once and retries. */
  authFetch: <T>(path: string, init?: RequestInit) => Promise<T>
  setUser: (user: User) => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
