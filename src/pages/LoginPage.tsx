import { Navigate } from "react-router"

import { useAuth } from "@/auth/AuthContext"
import { LoginForm } from "@/components/organisms/LoginForm"
import { ApiError } from "@/lib/api"

// Map API statuses (trail-companion-api/docs/auth.md) to user-facing messages.
function toLoginError(e: unknown) {
  if (e instanceof ApiError) {
    if (e.status === 401) return new Error("Invalid email or password")
    if (e.status === 429) return new Error("Too many attempts, try again in a minute")
    if (e.validationErrors.length) return new Error(e.validationErrors.map((v) => v.message).join(" "))
  }
  return new Error("Login failed")
}

export default function LoginPage() {
  const { user, login } = useAuth()
  if (user) return <Navigate to="/" replace />
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <LoginForm
        onSubmit={(email, password) =>
          login(email, password).catch((e) => {
            throw toLoginError(e)
          })
        }
      />
    </main>
  )
}
