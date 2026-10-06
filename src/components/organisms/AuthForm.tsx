import { useEffect, useState } from "react"

import { ErrorText } from "@/components/atoms/ErrorText"
import { FormField } from "@/components/molecules/FormField"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RateLimitedError } from "@/lib/api"

type AuthFormProps = {
  title: string
  submitLabel: string
  pendingLabel: string
  newPassword?: boolean
  footer?: React.ReactNode
  /** Throw an Error with a user-facing message on failure. RateLimitedError starts a cooldown. */
  onSubmit: (username: string, password: string) => Promise<void>
}

export function AuthForm({ title, submitLabel, pendingLabel, newPassword, footer, onSubmit }: AuthFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(undefined)
    setPending(true)
    try {
      await onSubmit(username, password)
    } catch (err) {
      if (err instanceof RateLimitedError) setCooldown(err.seconds)
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <FormField
            label="Username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            maxLength={32}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <FormField
            label="Password"
            type="password"
            autoComplete={newPassword ? "new-password" : "current-password"}
            required
            minLength={newPassword ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <ErrorText>{error}</ErrorText>}
          <Button type="submit" block disabled={pending || cooldown > 0}>
            {cooldown > 0 ? `Try again in ${cooldown}s` : pending ? pendingLabel : submitLabel}
          </Button>
        </form>
        {footer && <div className="mt-4 text-center text-[0.8125rem] text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  )
}
