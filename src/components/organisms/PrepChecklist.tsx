import { useState } from "react"

import { Card } from "@/components/ui/card"
import { checkId, loadChecks, saveChecks } from "@/lib/checks"
import type { Prep } from "@/lib/planMath"

type Props = { prep: Prep; stationId: string; runId: string }

/** Card 4. Ticks are kept on this device only, per run. */
export function PrepChecklist({ prep, stationId, runId }: Props) {
  const [ticks, setTicks] = useState(() => loadChecks(runId))

  const toggle = (id: string) => {
    const next = { ...ticks }
    if (next[id]) delete next[id]
    else next[id] = true
    setTicks(next)
    saveChecks(runId, next)
  }

  const group = (title: string, name: string, entries: string[]) =>
    entries.length === 0 ? null : (
      <div>
        <p className="mb-1 text-xs font-extrabold text-muted-foreground">{title}</p>
        <ul>
          {entries.map((entry, i) => {
            const id = checkId(stationId, name, i)
            return (
              <li key={id}>
                <label className="flex min-h-8 items-center gap-2.5 py-1 text-[0.95rem] font-semibold">
                  <input type="checkbox" className="size-5 flex-none accent-primary" checked={Boolean(ticks[id])} onChange={() => toggle(id)} />
                  <span className={ticks[id] ? "text-muted-foreground line-through" : ""}>{entry}</span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>
    )

  const empty = !prep.kit.length && !prep.food.length && !prep.packNext.length

  return (
    <Card>
      <p className="text-xs font-extrabold text-muted-foreground">Have ready at {prep.station}</p>
      {empty && <p className="text-[0.8125rem] text-muted-foreground">Nothing planned for this station.</p>}
      {group("Kit & actions", "kit", prep.kit)}
      {group("Food & drink at the station", "food", prep.food)}
      {group("Pack for the next segment", "pack", prep.packNext)}
      <p className="text-[0.8125rem] text-muted-foreground">Ticks stay on this device.</p>
    </Card>
  )
}
