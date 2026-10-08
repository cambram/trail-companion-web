import { useState } from "react"
import { useNavigate, useParams } from "react-router"

import { useAuth } from "@/auth/AuthContext"
import { AppFrame } from "@/components/atoms/AppFrame"
import { BackHeader } from "@/components/molecules/BackHeader"
import { FormField } from "@/components/molecules/FormField"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ApiError } from "@/lib/api"
import { racesApi } from "@/lib/racesApi"

const digits = (v: string) => v.replace(/\D/g, "").slice(0, 6)

function toJoinError(e: unknown) {
  if (e instanceof ApiError) {
    if (e.status === 404) return "No race found for that PIN"
    if (e.status === 429) return "Too many attempts, try again in a minute"
    if (e.validationErrors.length) return e.validationErrors.map((v) => v.message).join(" ")
  }
  return "Could not join the race"
}

export default function JoinPage() {
  const { pin: linkPin = "" } = useParams()
  const navigate = useNavigate()
  const { authFetch } = useAuth()
  const [pin, setPin] = useState(digits(linkPin))
  const [error, setError] = useState<string>()
  const [joining, setJoining] = useState(false)

  const join = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoining(true)
    setError(undefined)
    try {
      const race = await racesApi(authFetch).joinRace(pin)
      navigate(`/races/${race.id}`, { replace: true })
    } catch (err) {
      setError(toJoinError(err))
      setJoining(false)
    }
  }

  return (
    <AppFrame>
      <BackHeader to="/" label="Back to races" title="Join a race" />
      <Card>
        <form onSubmit={join} className="grid gap-3.5">
          <FormField
            label="6-digit race PIN"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000000"
            className="text-center text-2xl tracking-[0.2em] tabular-nums"
            value={pin}
            onChange={(e) => setPin(digits(e.target.value))}
            error={error}
          />
          <Button type="submit" block disabled={pin.length !== 6 || joining}>
            {joining ? "Joining..." : "Join race"}
          </Button>
        </form>
      </Card>
      <p className="mt-3 text-center text-[0.8125rem] text-muted-foreground">
        Crew get read-only access to the athlete's plan.
      </p>
    </AppFrame>
  )
}
