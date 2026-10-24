import { useState } from "react"

import { StatusPill } from "@/components/atoms/StatusPill"
import { InsightTile } from "@/components/molecules/InsightTile"
import { Card } from "@/components/ui/card"
import { auditTrail, insights, segmentStats, type AuditEvent, type ReminderState } from "@/lib/planInsights"
import { allocate, carbsOf, clockToMin, fmtClock, fmtDur, fmtKm, fmtPace, legs, needed, planned } from "@/lib/planMath"
import type { RaceDetail } from "@/lib/racesApi"
import type { Tone } from "@/lib/tone"
import { cn } from "@/lib/utils"

type Filter = "all" | "fuel" | "crew" | "skip"

const FILTERS: [Filter, string][] = [["all", "Everything"], ["fuel", "Eating"], ["crew", "Crew stops"], ["skip", "Skips"]]

const sg = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(Math.round(n))} g`

const NODE: Record<ReminderState, string> = {
  ok: "bg-green",
  short: "bg-red",
  empty: "bg-red",
  over: "bg-amber",
  small: "bg-violet",
  skipped: "border-2 border-dashed border-muted-foreground bg-background",
  "skip-food": "bg-amber",
}

const TAG: Record<ReminderState, { tone: Tone; text: (d: number) => string }> = {
  ok: { tone: "green", text: sg },
  short: { tone: "red", text: sg },
  empty: { tone: "red", text: () => "empty" },
  over: { tone: "amber", text: sg },
  small: { tone: "violet", text: () => "small" },
  skipped: { tone: "muted", text: () => "skipped" },
  "skip-food": { tone: "amber", text: () => "on a skip" },
}

const keeps: Record<Filter, (e: AuditEvent) => boolean> = {
  all: () => true,
  fuel: (e) => (e.reminder ? e.reminder.carbs > 0 : !!e.station),
  crew: (e) => !!e.station,
  skip: (e) => e.reminder?.state === "skipped" || e.reminder?.state === "skip-food",
}

function BalanceBar({ e, scale }: { e: AuditEvent; scale: number }) {
  const w = `${Math.min(50, (Math.abs(e.balance) / scale) * 50)}%`
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-2 w-24 shrink-0 rounded-full bg-secondary" role="img" aria-label={`Balance ${sg(e.balance)}`}>
        <span className="absolute inset-y-[-2px] left-1/2 w-px bg-muted-foreground" />
        <span
          className={cn("absolute inset-y-0 rounded-full", e.balance >= 0 ? "left-1/2 bg-green" : "right-1/2 bg-red")}
          style={{ width: w }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {Math.round(e.carbsIn)} g in · {Math.round(e.carbsOut)} g out <b className="text-foreground">{sg(e.balance)}</b>
      </p>
    </div>
  )
}

function Row({ time, elapsed, node, children }: { time?: string; elapsed?: string; node?: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[52px_minmax(0,1fr)] gap-x-2">
      <div className="pt-3 text-right tabular-nums">
        {time && <p className="text-sm font-extrabold">{time}</p>}
        {elapsed && <p className="text-xs text-muted-foreground">{elapsed}</p>}
      </div>
      <div className="relative pb-2.5 pl-6">
        {node && <span className={cn("absolute top-4 left-0 size-3 -translate-x-1/2 rounded-full ring-4 ring-background", node)} />}
        {children}
      </div>
    </li>
  )
}

const card = "rounded-xl bg-card px-3.5 py-3 shadow-card"
const where = (e: AuditEvent) => `${e.pos.km === null ? "" : `${fmtKm(e.pos.km)} · `}↑${Math.round(e.pos.ascent)} m`

function EventCard({ e, scale, avg, carbs }: { e: AuditEvent; scale: number; avg: number | null; carbs: number }) {
  const r = e.reminder
  if (r) {
    const tag = TAG[r.state]
    const sodium = r.items.reduce((a, i) => a + (i.sodium ?? 0), 0)
    const caffeine = r.items.reduce((a, i) => a + (i.caffeine ?? 0), 0)
    return (
      <div className={cn(card, "space-y-1.5")}>
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-sm font-extrabold">
            <span className="font-semibold text-muted-foreground">#{r.number}</span> {r.items.map((i) => i.name).join(" + ") || "Skip"}
          </p>
          <StatusPill tone={tag.tone}>{tag.text(r.carbs - r.target)}</StatusPill>
        </div>
        {r.rule !== "full" && r.station && <p className="text-xs text-muted-foreground">{r.station}</p>}
        <p className="text-xs text-muted-foreground">
          {Math.round(r.carbs)} g carbs{sodium > 0 && ` · ${Math.round(sodium)} mg sodium`}{caffeine > 0 && ` · ${Math.round(caffeine)} mg caffeine`} · {where(e)}
        </p>
        <BalanceBar e={e} scale={scale} />
      </div>
    )
  }
  if (e.station) {
    return (
      <div className={cn(card, "space-y-1.5 border-l-4 border-violet")}>
        <p className="text-[0.6875rem] font-extrabold tracking-wide text-muted-foreground">CREW</p>
        <p className="text-sm font-extrabold">{e.station.name.trim() || "Aid station"}</p>
        <p className="text-xs text-muted-foreground">{Math.round(carbs)} g carbs · {where(e)}</p>
        <BalanceBar e={e} scale={scale} />
      </div>
    )
  }
  return (
    <div className={cn(card, "text-sm font-extrabold")}>
      {e.kind === "start" ? "Start" : "Finish"}
      {e.kind === "finish" && (
        <span className="ml-2 text-xs font-semibold text-muted-foreground">
          {fmtDur(e.min)} · {avg === null ? "–" : `${Math.round(avg)} g/h avg`}
        </span>
      )}
    </div>
  )
}

export function AuditTab({ race }: { race: RaceDetail }) {
  const [filter, setFilter] = useState<Filter>("all")
  if (race.segments.length === 0) {
    return (
      <Card>
        <p className="font-extrabold">No segments yet</p>
        <p className="text-sm text-muted-foreground">Add segments on the Plan tab to see the audit trail.</p>
      </Card>
    )
  }
  const events = auditTrail(race)
  const i = insights(race)
  const allocs = allocate(race)
  const spans = legs(race.segments)
  const start = race.startTime ? clockToMin(race.startTime) : null
  const time = (m: number) => (start === null ? fmtDur(m) : fmtClock(start + m))
  const scale = Math.max(80, ...events.map((e) => Math.abs(e.balance)))
  const total = race.segments.reduce((a, s, n) => a + planned(s, allocs[n]), 0)
  const avg = (e: AuditEvent) => (e.min > 0 ? (total / e.min) * 60 : null)
  const segStart = (n: number) => race.segments.slice(0, n).reduce((a, s) => a + (s.duration || 0), 0)
  const net = i.netAtFinish
  const netTone: Tone = Math.abs(net) <= 15 ? "green" : net > 0 ? "amber" : "red"
  const trail: React.ReactNode[] = []
  let prev: AuditEvent | null = null
  let seg = -1
  for (const [k, e] of events.entries()) {
    const show = e.kind === "start" || e.kind === "finish" || keeps[filter](e)
    if (!show) continue
    if (filter === "all") {
      if (prev) {
        const km = prev.pos.km !== null && e.pos.km !== null ? ` · +${Math.round((e.pos.km - prev.pos.km) * 100) / 100} km` : ""
        trail.push(
          <Row key={`g${k}`}>
            <p className="pb-1 text-xs font-semibold text-muted-foreground tabular-nums">
              +{fmtDur(e.min - prev.min)}{km} · ↑{Math.round(e.pos.ascent - prev.pos.ascent)} m
            </p>
          </Row>,
        )
      }
      if (e.segmentIndex !== seg) {
        seg = e.segmentIndex
        const s = race.segments[seg]
        const st = segmentStats(s, allocs[seg], spans[seg])
        const chips = [
          `${time(segStart(seg))}–${time(segStart(seg) + (s.duration || 0))}`,
          st.distance === null ? null : fmtKm(st.distance),
          s.ascentM === null ? null : `↑${s.ascentM} m`,
          st.pace === null ? null : `${fmtPace(st.pace)} /km`,
          `${Math.round(planned(s, allocs[seg]))} / ${needed(race.target, s)} g`,
        ].filter(Boolean)
        trail.push(
          <Row key={`d${k}`}>
            <div className={cn(card, "border-l-4 border-violet")}>
              <p className="text-[0.6875rem] font-extrabold tracking-wide text-muted-foreground">SEGMENT {seg + 1} OF {race.segments.length}</p>
              <p className="text-sm font-extrabold">{s.name.trim() || `Segment ${seg + 1}`}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{chips.join(" · ")}</p>
            </div>
          </Row>,
        )
      }
    }
    prev = e
    trail.push(
      <Row key={`e${k}`} time={time(e.min)} elapsed={start === null ? undefined : fmtDur(e.min)} node={e.reminder ? NODE[e.reminder.state] : e.station ? "bg-primary" : "bg-foreground"}>
        <EventCard e={e} scale={scale} avg={avg(e)} carbs={e.station ? carbsOf(e.station.items) : 0} />
      </Row>,
    )
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        <InsightTile tone={netTone} label="Net at finish" value={sg(net)}>vs {race.target} g/h target</InsightTile>
        {i.low && <InsightTile tone={i.low.value < -40 ? "amber" : "green"} label="Lowest point" value={sg(i.low.value)}>at {time(i.low.min)}</InsightTile>}
        {i.gap && <InsightTile tone="amber" label="Longest gap" value={fmtDur(i.gap.lenMin)}>{time(i.gap.fromMin)} to {time(i.gap.toMin)}</InsightTile>}
        {i.climbPerHour !== null && (
          <InsightTile tone="violet" label="Climb" value={`${Math.round(i.climbPerHour)} m/h`}>
            {i.climbPerKm !== null && `${Math.round(i.climbPerKm)} m/km`}
          </InsightTile>
        )}
      </div>
      <div role="group" aria-label="Filter audit trail" className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map(([f, label]) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn("min-h-9 shrink-0 rounded-full px-3.5 text-sm font-bold", filter === f ? "bg-primary text-primary-foreground" : "bg-card text-foreground shadow-card")}
          >
            {label}
          </button>
        ))}
      </div>
      <ol className="relative before:absolute before:inset-y-0 before:left-[60px] before:w-1 before:-translate-x-1/2 before:rounded-full before:bg-secondary">
        {trail}
      </ol>
    </div>
  )
}
