import { useState } from "react"

import { Button } from "@/components/ui/button"
import { fmtInstant, nearestInstant } from "@/lib/planMath"

type Props = {
  valueMs: number
  timeZone: string
  label: string
  emptyLabel?: string
  onSave: (ms: number) => Promise<boolean>
}

/** A time you can tap to correct. The typed HH:mm lands on the day closest to the current value. */
export function TimeEdit({ valueMs, timeZone, label, emptyLabel, onSave }: Props) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState("")
  const [saving, setSaving] = useState(false)
  const current = fmtInstant(valueMs, timeZone)

  if (!editing)
    return (
      <button
        type="button"
        aria-label={`${emptyLabel ? "Add" : "Edit"} ${label}`}
        className="min-h-8 rounded-full bg-secondary px-3 text-[0.95rem] font-extrabold"
        onClick={() => {
          setText(current)
          setEditing(true)
        }}
      >
        {emptyLabel ?? current}
      </button>
    )

  const save = async () => {
    setSaving(true)
    const ok = await onSave(nearestInstant(valueMs, text, timeZone))
    setSaving(false)
    if (ok) setEditing(false)
  }

  return (
    <span className="flex flex-wrap items-center justify-end gap-1.5">
      <input
        aria-label={label}
        type="time"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[46px] rounded-md bg-secondary px-3.5 text-base font-semibold"
      />
      <Button size="sm" disabled={!text || saving} onClick={save}>
        Save
      </Button>
      <Button size="sm" variant="secondary" disabled={saving} onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </span>
  )
}
