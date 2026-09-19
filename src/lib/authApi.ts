import { apiFetch } from "@/lib/api"

export type Session = { accessToken: string; expiresAtUtc: string }
export type User = { id: string; email: string; createdAtUtc: string }

export const login = (email: string, password: string) =>
  apiFetch<Session>("/api/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })

export const getMe = (token: string) =>
  apiFetch<User>("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
