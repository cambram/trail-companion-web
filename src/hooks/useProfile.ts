import { useCallback, useMemo } from "react"

import { useAuth } from "@/auth/AuthContext"
import { ApiError } from "@/lib/api"
import { accountApi } from "@/lib/authApi"

/** Map API errors from the account routes to one readable line. */
export function accountError(e: unknown, fallback: string) {
  if (e instanceof ApiError) {
    // Password routes answer a wrong password with a ProblemDetails 401; authFetch leaves the session alone.
    if (e.status === 401) return "That password is wrong"
    if (e.status === 429) return "Too many attempts, try again in a minute"
    if (e.validationErrors.length) return e.validationErrors.map((v) => v.message).join(" ")
  }
  return fallback
}

export function useProfile() {
  const { user, authFetch, setUser, logout } = useAuth()
  const api = useMemo(() => accountApi(authFetch), [authFetch])

  const saveName = useCallback(
    async (firstName: string, lastName: string) => setUser(await api.updateProfile(firstName, lastName)),
    [api, setUser],
  )

  const deleteAccount = useCallback(
    async (password: string) => {
      await api.deleteAccount(password)
      await logout()
    },
    [api, logout],
  )

  return { user: user!, saveName, changePassword: api.changePassword, deleteAccount, logout }
}
