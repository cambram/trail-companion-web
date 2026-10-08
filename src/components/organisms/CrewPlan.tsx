import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { clockToMin, crewStops, fluid, fmtClock, fmtDur, kitLabel, planned } from "@/lib/planMath"
import type { RaceDetail } from "@/lib/racesApi"

function CrewList({ title, entries }: { title: string; entries: string[] }) {
  if (!entries.length) return null
  return (
    <div>
      <p className="mb-1 text-xs font-extrabold text-muted-foreground">{title}</p>
      <ul className="grid gap-1 text-[0.95rem] font-semibold">
        {entries.map((e, k) => (
          <li key={k}>{e}</li>
        ))}
      </ul>
    </div>
  )
}

/** Read-only plan for crew: what to have ready at each aid station, nutrition detail on demand. */
export function CrewPlan({ race }: { race: RaceDetail }) {
  const [showNutrition, setShowNutrition] = useState(false)
  const stops = crewStops(race)

  return (
    <div className="grid gap-3.5">
      <div className="rounded-[26px] bg-primary p-[18px] text-primary-foreground">
        <div className="flex items-center justify-between gap-3">
          <b className="min-w-0 flex-1 truncate text-[1.35rem] font-extrabold tracking-[-0.03em]">{race.name}</b>
          <span className="flex-none rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-bold">Read-only</span>
        </div>
        <p className="mt-1 text-[0.8125rem] text-primary-foreground/65">
          {race.raceDate ? new Date(`${race.raceDate}T00:00`).toLocaleDateString() : "No date"} · Start{" "}
          {race.startTime ? fmtClock(clockToMin(race.startTime)) : "not set"}
        </p>
      </div>

      <p className="px-1 text-xs font-extrabold text-muted-foreground">What to have ready</p>
      {stops.length === 0 && (
        <Card className="items-center py-[26px] text-center">
          <b>No aid stations yet</b>
          <p className="text-[0.8125rem] text-muted-foreground">The athlete hasn't added any aid stations.</p>
        </Card>
      )}
      {stops.map(({ station, eta, packNext }) => (
        <Card key={station.id}>
          <div className="flex items-center justify-between gap-3">
            <b className="min-w-0 flex-1 truncate text-[1.05rem] tracking-[-0.02em]">{station.name}</b>
            <span className="flex-none text-[0.8125rem] font-bold">{eta === null ? "No ETA" : `ETA ${fmtClock(eta)}`}</span>
          </div>
          <CrewList
            title="Kit & actions"
            entries={station.kit.map(kitLabel)}
          />
          <CrewList title="Food & drink here" entries={station.items.map((i) => i.name)} />
          <CrewList title="Pack for next segment" entries={packNext.map((i) => i.name)} />
          {station.notes && <p className="text-[0.8125rem] text-muted-foreground">{station.notes}</p>}
        </Card>
      ))}

      <Button variant="quiet" className="justify-self-center" onClick={() => setShowNutrition((v) => !v)}>
        {showNutrition ? "Hide" : "Show"} athlete's nutrition detail
      </Button>
      {showNutrition && (
        <Card>
          {race.segments.map((s) => (
            <div key={s.id} className="flex items-center gap-3 border-t border-line pt-2 first:border-t-0 first:pt-0">
              <span className="min-w-0 flex-1 truncate font-semibold">{s.name || "Segment"}</span>
              <span className="text-[0.8125rem] text-muted-foreground">{fmtDur(s.duration)}</span>
              <span className="w-14 text-right text-[0.8125rem] font-bold">{planned(s)} g</span>
              <span className="w-16 text-right text-[0.8125rem] font-bold">{fluid(s)} ml</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
