import { Tent } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { StatusPill } from "@/components/atoms/StatusPill"
import { ArrivalWindowRow } from "@/components/molecules/ArrivalWindowRow"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { checkId, type Ticks } from "@/lib/checks"
import { crewBrief, fmtCounts } from "@/lib/planInsights"
import { carbsOf, crewStops, fmtDur, fmtKm, kitLabel, legs, type CrewStop } from "@/lib/planMath"
import type { RaceDetail } from "@/lib/racesApi"
import { useTicks } from "@/hooks/useTicks"

type CopyState = "idle" | "copied" | "blocked"

const block = "rounded-xl bg-secondary px-3.5 py-3"

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={block}>
      <p className="text-xs font-extrabold text-muted-foreground">{title}</p>
      <p className="text-sm font-semibold">{children}</p>
    </div>
  )
}

type PanelProps = {
  stop: CrewStop
  n: number
  of: number
  segIndex: number
  km: number | null
  plannedMin: number
  startTime: string | null
  ticks: Ticks
  onToggle: (id: string) => void
}

function StopPanel({ stop, n, of, segIndex, km, plannedMin, startTime, ticks, onToggle }: PanelProps) {
  const { station, packNext } = stop
  const kit = station.kit
  const done = kit.filter((_, i) => ticks[checkId(station.id, "kit", i)]).length
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="rounded-full bg-violet-soft px-2.5 py-1 text-xs font-extrabold text-violet"><Tent className="size-4" aria-hidden /></span>
          <div className="min-w-0">
            <p className="font-extrabold">{station.name.trim() || "Aid station"}</p>
            <p className="text-xs text-muted-foreground">{km === null ? "–" : fmtKm(km)} · stop {n} of {of}</p>
          </div>
        </div>
        {kit.length > 0 && <StatusPill tone={done === kit.length ? "green" : "muted"}>{done}/{kit.length} ready</StatusPill>}
      </div>
      {startTime ? <ArrivalWindowRow plannedMin={plannedMin} startTime={startTime} /> : <p className="text-xs text-muted-foreground">{fmtDur(plannedMin)} into the race</p>}
      {station.items.length > 0 && <Block title={`Hand over · ${Math.round(carbsOf(station.items))} g`}>{station.items.map((i) => i.name).join(", ")}</Block>}
      <Block title={`Pack for segment ${segIndex + 1}`}>{fmtCounts(packNext) || "–"}</Block>
      {kit.length > 0 && <Block title="Kit">{kit.map(kitLabel).join(", ")}</Block>}
      {station.notes && <Block title="Notes">{station.notes}</Block>}
      {kit.length > 0 && (
        <ul>
          {kit.map((k, i) => {
            const id = checkId(station.id, "kit", i)
            return (
              <li key={id}>
                <label className="flex min-h-8 items-center gap-2.5 py-1 text-[0.95rem] font-semibold">
                  <input type="checkbox" className="size-5 flex-none accent-primary" checked={Boolean(ticks[id])} onChange={() => onToggle(id)} />
                  <span className={ticks[id] ? "text-muted-foreground line-through" : ""}>{kitLabel(k)}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export function CrewTab({ race }: { race: RaceDetail }) {
  const { ticks, toggle } = useTicks(`plan-${race.id}`)
  const [copy, setCopy] = useState<CopyState>("idle")
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const stops = crewStops(race)
  if (stops.length === 0) {
    return (
      <Card>
        <p className="font-extrabold">No aid stations yet</p>
        <p className="text-sm text-muted-foreground">Add aid stations on the Plan tab to build the crew brief.</p>
      </Card>
    )
  }

  const brief = crewBrief(race)
  const spans = legs(race.segments)
  const onCopy = async () => {
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(brief)
      setCopy("copied")
      timer.current = setTimeout(() => setCopy("idle"), 2000)
    } catch {
      setCopy("blocked")
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <p className="font-extrabold">Crew brief</p>
        <p className="text-sm text-muted-foreground">Arrival windows assume you run 10% faster or slower than plan. Share before race morning.</p>
        <Button size="sm" onClick={onCopy}>{copy === "copied" ? "Copied" : copy === "blocked" ? "Copy blocked" : "Copy brief"}</Button>
        {copy === "blocked" && (
          <textarea readOnly aria-label="Crew brief" rows={10} value={brief} className="w-full rounded-xl bg-secondary p-3 text-base" onFocus={(e) => e.currentTarget.select()} />
        )}
      </Card>
      {stops.map((stop, n) => {
        const segIndex = race.segments.findIndex((s) => s.aidStation?.id === stop.station.id)
        const plannedMin = race.segments.slice(0, segIndex).reduce((t, s) => t + (s.duration || 0), 0)
        const km = segIndex <= 0 ? 0 : spans[segIndex - 1].end
        return (
          <StopPanel key={stop.station.id} stop={stop} n={n + 1} of={stops.length} segIndex={segIndex} km={km} plannedMin={plannedMin} startTime={race.startTime} ticks={ticks} onToggle={toggle} />
        )
      })}
    </div>
  )
}
