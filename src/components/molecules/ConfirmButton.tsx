import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

type Props = { label: string; armedLabel: string; onConfirm: () => void }

/** Tap once to arm (3s), tap again to confirm. */
export function ConfirmButton({ label, armedLabel, onConfirm }: Props) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  return (
    <Button variant={armed ? "quietArmed" : "quiet"} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? armedLabel : label}
    </Button>
  )
}
