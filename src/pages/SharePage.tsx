import { QRCodeSVG } from "qrcode.react"
import { useState } from "react"
import { Navigate, useParams } from "react-router"

import { useAuth } from "@/auth/AuthContext"
import { AppFrame } from "@/components/atoms/AppFrame"
import { ErrorText } from "@/components/atoms/ErrorText"
import { BackHeader } from "@/components/molecules/BackHeader"
import { ConfirmButton } from "@/components/molecules/ConfirmButton"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useCrew } from "@/hooks/useCrew"
import { useRace } from "@/hooks/useRace"
import { ApiError } from "@/lib/api"
import { racesApi } from "@/lib/racesApi"

export default function SharePage() {
  const { id = "" } = useParams()
  const { authFetch } = useAuth()
  const { race, loadError } = useRace(id)
  const { crew, error: crewError, remove } = useCrew(id)
  const [pin, setPin] = useState<string>()
  const [copied, setCopied] = useState(false)
  const [actionError, setActionError] = useState<string>()

  if (loadError instanceof ApiError && loadError.status === 404) return <Navigate to="/" replace />
  if (race && race.role !== "Owner") return <Navigate to={`/races/${id}`} replace />

  const current = pin ?? race?.pin ?? ""
  const link = `${window.location.origin}/join/${current}`

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(undefined)
    try {
      await fn()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong")
    }
  }

  const copy = () =>
    run(async () => {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })

  return (
    <AppFrame>
      <BackHeader to={`/races/${id}`} label="Back to race plan" title="Share with crew" />
      {loadError && !(loadError instanceof ApiError && loadError.status === 404) && <ErrorText>{loadError.message}</ErrorText>}
      {!race && !loadError && <p className="text-[0.8125rem] text-muted-foreground">Loading...</p>}
      {race && (
        <div className="grid gap-3.5">
          <Card className="items-center text-center">
            <p className="text-xs font-extrabold text-muted-foreground">Race PIN</p>
            <p className="text-[2rem] font-extrabold tracking-[0.12em] tabular-nums">
              {current.slice(0, 3)} {current.slice(3)}
            </p>
            <div className="rounded-[14px] bg-white p-3">
              <QRCodeSVG value={link} size={176} marginSize={1} bgColor="#FFFFFF" fgColor="#0E0F11" title="Race join QR code" />
            </div>
            <p className="text-[0.8125rem] text-muted-foreground">
              Crew scan this with their camera or enter the PIN in Crewmate.
            </p>
            <Button block onClick={copy}>
              {copied ? "Link copied" : "Copy invite link"}
            </Button>
            <ConfirmButton
              label="New PIN"
              armedLabel="Tap again: the old PIN stops working"
              onConfirm={() => run(async () => setPin((await racesApi(authFetch).regeneratePin(id)).pin))}
            />
          </Card>
          {actionError && <ErrorText>{actionError}</ErrorText>}
          <Card>
            <p className="text-xs font-extrabold text-muted-foreground">Crew · {crew?.length ?? 0}</p>
            {crewError && <ErrorText>{crewError}</ErrorText>}
            {crew?.length === 0 && <p className="text-[0.8125rem] text-muted-foreground">No crew yet.</p>}
            {crew?.map((m) => (
              <div key={m.appUserId} className="flex items-center gap-3 border-t border-line pt-2">
                <span className="min-w-0 flex-1">
                  <b className="block truncate">{m.displayName}</b>
                  <span className="text-[0.8125rem] text-muted-foreground">
                    Joined {new Date(m.joinedAtUtc).toLocaleDateString()}
                  </span>
                </span>
                <ConfirmButton label="Remove" armedLabel="Tap to remove" onConfirm={() => run(() => remove(m.appUserId))} />
              </div>
            ))}
            <p className="text-[0.8125rem] text-muted-foreground">Crew can view the plan. They can't edit it.</p>
          </Card>
        </div>
      )}
    </AppFrame>
  )
}
