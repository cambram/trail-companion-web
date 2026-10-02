import { Link, Navigate } from "react-router"

import { useAuth } from "@/auth/AuthContext"
import { AppFrame } from "@/components/atoms/AppFrame"
import { Heading } from "@/components/atoms/Heading"
import { Subtitle } from "@/components/atoms/Subtitle"
import { AuthForm } from "@/components/organisms/AuthForm"
import { ApiError, RateLimitedError } from "@/lib/api"
import { register } from "@/lib/authApi"
import { registrationEnabled } from "@/lib/features"

function toRegisterError(e: unknown) {
  if (e instanceof ApiError) {
    if (e.status === 403) return new Error("Account creation is currently closed")
    if (e.status === 409) return new Error("An account with this email already exists")
    if (e.validationErrors.length) return new Error(e.validationErrors.map((v) => v.message).join(" "))
  }
  return new Error("Could not create account")
}

export default function RegisterPage() {
  const { user, login } = useAuth()
  if (user) return <Navigate to="/" replace />
  if (!registrationEnabled)
    return (
      <AppFrame className="pt-6">
        <header className="pb-[18px]">
          <Heading>Trail Companion</Heading>
          <Subtitle>Account creation is currently closed</Subtitle>
        </header>
        <p className="text-center text-[0.8125rem] text-muted-foreground">
          Have an account?{" "}
          <Link to="/login" className="font-bold text-foreground">
            Log in
          </Link>
        </p>
      </AppFrame>
    )
  return (
    <AppFrame className="pt-6">
      <header className="pb-[18px]">
        <Heading>Trail Companion</Heading>
        <Subtitle>Create an account to plan your races</Subtitle>
      </header>
      <AuthForm
        title="Create account"
        submitLabel="Create account"
        pendingLabel="Creating..."
        newPassword
        footer={
          <>
            Have an account?{" "}
            <Link to="/login" className="font-bold text-foreground">
              Log in
            </Link>
          </>
        }
        onSubmit={async (email, password) => {
          try {
            await register(email, password)
          } catch (e) {
            throw toRegisterError(e)
          }
          try {
            await login(email, password)
          } catch (e) {
            if (e instanceof ApiError && e.status === 429) throw new RateLimitedError("Account created. Log in in a minute")
            throw new Error("Account created. Please log in")
          }
        }}
      />
    </AppFrame>
  )
}
