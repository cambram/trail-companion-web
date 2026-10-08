import { Link, Navigate, useLocation } from "react-router"

import { useAuth } from "@/auth/AuthContext"
import { AppFrame } from "@/components/atoms/AppFrame"
import { Heading } from "@/components/atoms/Heading"
import { Subtitle } from "@/components/atoms/Subtitle"
import { AuthForm } from "@/components/organisms/AuthForm"
import { ApiError, RateLimitedError } from "@/lib/api"
import { registrationEnabled } from "@/lib/features"

// Map API statuses (trail-companion-api/docs/auth.md) to user-facing messages.
function toLoginError(e: unknown) {
  if (e instanceof ApiError) {
    if (e.status === 401) return new Error("Invalid username or password")
    if (e.status === 429) return new RateLimitedError("Too many attempts, try again in a minute")
    if (e.validationErrors.length) return new Error(e.validationErrors.map((v) => v.message).join(" "))
  }
  return new Error("Login failed")
}

export default function LoginPage() {
  const { user, login } = useAuth()
  const state = useLocation().state as { notice?: string; from?: string } | null
  if (user) return <Navigate to={state?.from ?? "/"} replace />
  return (
    <AppFrame className="pt-6">
      <header className="pb-[18px]">
        <Heading>Trail Companion</Heading>
        <Subtitle>{state?.notice ?? "Log in to continue"}</Subtitle>
      </header>
      <AuthForm
        title="Log in"
        submitLabel="Log in"
        pendingLabel="Logging in..."
        footer={
          registrationEnabled ? (
            <>
              No account?{" "}
              <Link to="/register" state={state} className="font-bold text-foreground">
                Create one
              </Link>
            </>
          ) : undefined
        }
        onSubmit={(username, password) =>
          login(username, password).catch((e) => {
            throw toLoginError(e)
          })
        }
      />
    </AppFrame>
  )
}
