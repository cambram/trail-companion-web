import { Link, Navigate, useLocation } from "react-router"

import { useAuth } from "@/auth/AuthContext"
import { AppFrame } from "@/components/atoms/AppFrame"
import { Heading } from "@/components/atoms/Heading"
import { Subtitle } from "@/components/atoms/Subtitle"
import { AuthForm } from "@/components/organisms/AuthForm"
import { ApiError, RateLimitedError } from "@/lib/api"

// Map API statuses (trail-companion-api/docs/auth.md) to user-facing messages.
function toLoginError(e: unknown) {
  if (e instanceof ApiError) {
    if (e.status === 401) return new Error("Invalid email or password")
    if (e.status === 429) return new RateLimitedError("Too many attempts, try again in a minute")
    if (e.validationErrors.length) return new Error(e.validationErrors.map((v) => v.message).join(" "))
  }
  return new Error("Login failed")
}

export default function LoginPage() {
  const { user, login } = useAuth()
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  if (user) return <Navigate to="/" replace />
  return (
    <AppFrame className="pt-6">
      <header className="pb-[18px]">
        <Heading>Trail Companion</Heading>
        <Subtitle>{notice ?? "Log in to continue"}</Subtitle>
      </header>
      <AuthForm
        title="Log in"
        submitLabel="Log in"
        pendingLabel="Logging in..."
        footer={
          <>
            No account?{" "}
            <Link to="/register" className="font-bold text-foreground">
              Create one
            </Link>
          </>
        }
        onSubmit={(email, password) =>
          login(email, password).catch((e) => {
            throw toLoginError(e)
          })
        }
      />
    </AppFrame>
  )
}
