import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

type Props = { label: string; armedLabel: string; onConfirm: () => void }

/** Tap once to arm (3s), tap again to confirm. Disarms on confirm so a fast extra tap arms it again. */
export function ConfirmButton({ label, armedLabel, onConfirm }: Props) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  const press = () => {
    if (!armed) {
      setArmed(true)
      return
    }
    setArmed(false)
    onConfirm()
  }

  return (
    <Button variant={armed ? "quietArmed" : "quiet"} onClick={press}>
      {armed ? armedLabel : label}
    </Button>
  )
}
