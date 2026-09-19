import { Plus } from "lucide-react"
import { useState } from "react"

import { ErrorText } from "@/components/atoms/ErrorText"
import { FormField } from "@/components/molecules/FormField"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type Props = { onCreate: (name: string, target: number, startTime: string | null) => Promise<void> }

export function NewRaceForm({ onCreate }: Props) {
  const [name, setName] = useState("")
  const [target, setTarget] = useState("60")
  const [start, setStart] = useState("")
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    const t = Number(target)
    if (!trimmed) return setError("Enter a race name")
    if (trimmed.length > 200) return setError("Name is too long (max 200)")
    if (target.trim() === "" || !Number.isInteger(t) || t < 0) return setError("Target must be a whole number, 0 or more")
    setError(undefined)
    setPending(true)
    try {
      await onCreate(trimmed, t, start ? `${start}:00` : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create race")
      setPending(false)
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3">
        <FormField label="New race" placeholder="Race name" value={name} onChange={(e) => setName(e.target.value)} />
        <FormField
          label="Carb target (g/h)"
          type="number"
          inputMode="numeric"
          min={0}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <FormField label="Start time (optional)" type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" block disabled={pending}>
          <Plus aria-hidden />
          {pending ? "Creating..." : "Create race"}
        </Button>
      </form>
    </Card>
  )
}
