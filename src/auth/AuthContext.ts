import { createContext, useContext } from "react"

import type { User } from "@/lib/authApi"

export type AuthState = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  /** Call a protected route: attaches bearer, logs out on 401. */
  authFetch: <T>(path: string, init?: RequestInit) => Promise<T>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
