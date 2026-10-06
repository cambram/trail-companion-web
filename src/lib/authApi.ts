import type { AuthState } from "@/auth/AuthContext"
import { apiFetch } from "@/lib/api"

export type Session = { accessToken: string; expiresAtUtc: string }
export type User = {
  id: string
  username: string
  firstName: string | null
  lastName: string | null
  createdAtUtc: string
}

export const login = (username: string, password: string) =>
  apiFetch<Session>("/api/users/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })

export const register = (username: string, password: string) =>
  apiFetch<User>("/api/users/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })

/** The httpOnly cookie is the credential; no bearer needed. */
export const refresh = () => apiFetch<Session>("/api/users/refresh", { method: "POST" })

export const logout = () => apiFetch<void>("/api/users/logout", { method: "POST" })

export const accountApi = (authFetch: AuthState["authFetch"]) => ({
  updateProfile: (firstName: string, lastName: string) =>
    authFetch<User>("/api/users/me", { method: "PUT", body: JSON.stringify({ firstName, lastName }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    authFetch<void>("/api/users/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  deleteAccount: (password: string) =>
    authFetch<void>("/api/users/me", { method: "DELETE", body: JSON.stringify({ password }) }),
})
