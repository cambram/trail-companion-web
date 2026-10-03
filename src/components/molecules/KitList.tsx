import { X } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { KitEntry } from "@/lib/racesApi"
import { cn } from "@/lib/utils"

const PRESETS = ["Socks", "Shoes", "Shirt", "Jacket", "Headlamp", "Poles"]
const MAX_ENTRIES = 30

type Props = { kit: KitEntry[]; onChange: (kit: KitEntry[]) => void }

/** Planned or possible changes and pickups at an aid station, for the crew. */
export function KitList({ kit, onChange }: Props) {
  const [other, setOther] = useState<string>()

  const add = (label: string) => {
    const l = label.trim()
    if (l) onChange([...kit, { label: l, certainty: "Planned" }])
  }

  const toggle = (k: number) =>
    onChange(kit.map((e, x) => (x === k ? { ...e, certainty: e.certainty === "Planned" ? "Maybe" : "Planned" } : e)))

  return (
    <div>
      <p className="mb-2 text-xs font-extrabold text-muted-foreground">Kit &amp; crew</p>
      {kit.map((e, k) => (
        <div key={k} className="flex items-center gap-2.5 border-t border-line py-2">
          <button
            type="button"
            aria-label={`${e.label}: ${e.certainty}. Tap to change.`}
            onClick={() => toggle(k)}
            className={cn(
              "inline-flex min-h-8 flex-none items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold",
              e.certainty === "Planned"
                ? "bg-primary text-primary-foreground"
                : "border border-dashed border-muted-foreground text-ink-soft",
            )}
          >
            {e.certainty}
          </button>
          <span className="min-w-0 flex-1 truncate text-[0.95rem] font-semibold">{e.label}</span>
          <Button
            variant="icon"
            size="icon"
            className="size-8"
            aria-label={`Remove ${e.label}`}
            onClick={() => onChange(kit.filter((_, x) => x !== k))}
          >
            <X className="size-[15px]" aria-hidden />
          </Button>
        </div>
      ))}
      {kit.length < MAX_ENTRIES && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button key={p} variant="secondary" size="sm" className="min-h-8 px-3 text-xs" onClick={() => add(p)}>
              + {p}
            </Button>
          ))}
          {other === undefined ? (
            <Button variant="secondary" size="sm" className="min-h-8 px-3 text-xs" onClick={() => setOther("")}>
              + Other
            </Button>
          ) : (
            <form
              className="flex w-full gap-2"
              onSubmit={(ev) => {
                ev.preventDefault()
                add(other)
                setOther(undefined)
              }}
            >
              <Input
                autoFocus
                maxLength={100}
                aria-label="Kit item"
                placeholder="e.g. Buff"
                value={other}
                onChange={(ev) => setOther(ev.target.value)}
              />
              <Button type="submit" size="sm" disabled={!other.trim()}>
                Add
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
