import type { AidStation, Item, NutritionItem, NutritionType, PlannedItem, RaceDetail, Run, Segment } from "./racesApi"

const pad = (n: number) => String(n).padStart(2, "0")

export const fmtHM = (min: number) => `${Math.floor(min / 60)}:${pad(Math.round(min % 60))}`

export const fmtDur = (min: number) => {
  const r = Math.round(min)
  return `${Math.floor(r / 60)}h${pad(r % 60)}`
}

export const fmtPace = (minPerKm: number) => {
  const s = Math.round(minPerKm * 60)
  return `${Math.floor(s / 60)}:${pad(s % 60)}`
}

/** "3:30", "3.30", "3,30", "3 30", "330" -> 210 (H:MM, not decimal hours); "3" -> 180; "" -> 0; invalid -> null. */
export function parseDur(v: string): number | null {
  v = v.trim()
  if (!v) return 0
  const m = v.match(/^(\d{1,2})[:., ]?([0-5]\d)$/)
  if (m) return +m[1] < 24 ? +m[1] * 60 + +m[2] : null
  if (/^\d{1,2}$/.test(v)) return +v * 60
  return null
}

/** "12.5" or "12,5" -> 12.5, "" -> 0, negative or non-numeric -> null. Km. */
export function parseDistance(v: string): number | null {
  v = v.trim().replace(",", ".")
  if (!v) return 0
  return /^(\d+\.?\d*|\.\d+)$/.test(v) ? Number(v) : null
}

export const paceText = (duration: number, km: number | null) =>
  duration && km && km > 0 ? `${fmtPace(duration / km)} /km` : "– /km"

const roundKm = (km: number) => Math.round(km * 100) / 100

export const fmtKm = (km: number) => `${roundKm(km)} km`

export type Leg = { start: number; end: number | null; length: number | null }

/** Each segment starts at the last entered end mark before it, 0 km at the start line. Length is null when the end is blank. */
export function legs(segments: Pick<Segment, "endKm">[]): Leg[] {
  let last = 0
  return segments.map(({ endKm }) => {
    const start = last
    if (endKm !== null) last = endKm
    return { start, end: endKm, length: endKm === null ? null : roundKm(endKm - start) }
  })
}

export const NUTRITION_TYPES: NutritionType[] = ["Gel", "Liquid", "Solid", "Pill"]

/** Category colour, not status: see docs/styling.md 2.4. Literal strings so Tailwind emits them. */
export const NUTRITION_TYPE_CLASSES: Record<NutritionType, string> = {
  Gel: "bg-nutrition-gel-soft text-nutrition-gel",
  Liquid: "bg-nutrition-liquid-soft text-nutrition-liquid",
  Solid: "bg-nutrition-solid-soft text-nutrition-solid",
  Pill: "bg-nutrition-pill-soft text-nutrition-pill",
}

export const sizeUnit = (type: NutritionType) => (type === "Liquid" ? "ml" : type === "Pill" ? "mg" : "g")

export const sizeText = (n: Pick<NutritionItem, "type" | "size">) =>
  n.size === null ? "" : `${n.size} ${sizeUnit(n.type)}`

const carbsOf = (items: PlannedItem[]) => items.reduce((a, i) => a + (i.carbs ?? 0), 0)

const fluidOf = (items: PlannedItem[]) => items.reduce((a, i) => a + (i.type === "Liquid" ? (i.size ?? 0) : 0), 0)

/** Carbs eaten at the aid station before this segment. */
export const stationCarbs = (s: Segment) => carbsOf(s.aidStation?.items ?? [])

/** Segment items plus the aid station before it: station intake counts toward the following segment. */
export const planned = (s: Segment) => carbsOf(s.items) + stationCarbs(s)

export const fluid = (s: Segment) => fluidOf(s.items) + fluidOf(s.aidStation?.items ?? [])

export const needed = (target: number, s: Segment) => Math.round((s.duration / 60) * (target || 0))

export const pct = (p: number, n: number) => (n ? Math.min(100, Math.round((p / n) * 100)) : 0)

export function raceTotals(r: RaceDetail) {
  return r.segments.reduce(
    (t, s) => ({
      duration: t.duration + (s.duration || 0),
      distance: Math.max(t.distance, s.endKm ?? 0),
      planned: t.planned + planned(s),
      need: t.need + needed(r.target, s),
      fluid: t.fluid + fluid(s),
    }),
    { duration: 0, distance: 0, planned: 0, need: 0, fluid: 0 },
  )
}

/** Green when planned >= 95% of need. */
export const onTarget = (p: number, n: number) => n > 0 && p >= n * 0.95

/** "06:30:00" or "06:30" -> 390 minutes since midnight. */
export const clockToMin = (t: string) => {
  const [h, m] = t.split(":")
  return +h * 60 + +m
}

/** Minutes since race-day midnight -> "HH:mm", "+1d" past midnight. */
export function fmtClock(min: number) {
  const day = Math.floor(min / 1440)
  const m = Math.round(min % 1440)
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}${day ? ` +${day}d` : ""}`
}

/** Arrival at the end of each segment, minutes since midnight; null without a start time. */
export function etas(r: Pick<RaceDetail, "startTime" | "segments">) {
  if (!r.startTime) return r.segments.map(() => null)
  let t = clockToMin(r.startTime)
  return r.segments.map((s) => (t += s.duration || 0))
}

export type CrewStop = { station: AidStation; eta: number | null; packNext: Item[] }

/** Aid stations in race order with planned arrival and what goes in the vest for the segment after. */
export function crewStops(r: Pick<RaceDetail, "startTime" | "segments">): CrewStop[] {
  const arrivals = etas(r)
  const start = r.startTime ? clockToMin(r.startTime) : null
  return r.segments.flatMap((s, i) =>
    s.aidStation ? [{ station: s.aidStation, eta: i === 0 ? start : arrivals[i - 1], packNext: s.items }] : [],
  )
}

const MS_MIN = 60_000

type Wall = { y: number; m: number; d: number; h: number; mi: number }

function wall(ms: number, timeZone: string): Wall {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(ms)
      .map((p) => [p.type, p.value]),
  )
  return { y: +parts.year, m: +parts.month, d: +parts.day, h: +parts.hour, mi: +parts.minute }
}

/** Wall clock minus UTC at an instant, in ms. */
function offsetMs(ms: number, timeZone: string) {
  const w = wall(ms, timeZone)
  return Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi) - Math.floor(ms / MS_MIN) * MS_MIN
}

/** "HH:mm" of an instant on the wall clock of `timeZone`. */
export function fmtInstant(ms: number, timeZone: string) {
  const w = wall(ms, timeZone)
  return `${pad(w.h)}:${pad(w.mi)}`
}

/** "YYYY-MM-DD" of an instant on the wall clock of `timeZone`. */
export function zonedDate(ms: number, timeZone: string) {
  const w = wall(ms, timeZone)
  return `${w.y}-${pad(w.m)}-${pad(w.d)}`
}

/** A wall-clock date ("YYYY-MM-DD") and time ("HH:mm") in `timeZone` -> instant in ms. */
export function zonedToMs(date: string, hhmm: string, timeZone: string) {
  const [y, m, d] = date.split("-").map(Number)
  const [h, mi] = hhmm.split(":").map(Number)
  const guess = Date.UTC(y, m - 1, d, h, mi)
  return guess - offsetMs(guess - offsetMs(guess, timeZone), timeZone)
}

const shiftDate = (date: string, days: number) => {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/** The instant for a typed "HH:mm" that lies closest to `nearMs`, so a time typed after midnight lands on the right day. */
export function nearestInstant(nearMs: number, hhmm: string, timeZone: string) {
  const day = zonedDate(nearMs, timeZone)
  return [-1, 0, 1]
    .map((delta) => zonedToMs(shiftDate(day, delta), hhmm, timeZone))
    .reduce((best, c) => (Math.abs(c - nearMs) < Math.abs(best - nearMs) ? c : best))
}

export type Checkpoint = {
  key: string
  index: number
  name: string
  plannedMin: number
  km: number | null
  stationId: string | null
}

/**
 * Aid stations in race order, then the finish. A station sits before its segment, so it arrives where the segment
 * before it ends (0 for a station before the first segment). `km` is the cumulative mark there, null when blank.
 */
export function checkpoints(segments: Segment[]): Checkpoint[] {
  let elapsed = 0
  const out: Omit<Checkpoint, "index">[] = []
  segments.forEach((s, i) => {
    if (s.aidStation) {
      out.push({
        key: s.aidStation.id,
        name: s.aidStation.name || "Aid station",
        plannedMin: elapsed,
        km: i === 0 ? 0 : segments[i - 1].endKm,
        stationId: s.aidStation.id,
      })
    }
    elapsed += s.duration || 0
  })
  out.push({ key: "finish", name: "Finish", plannedMin: elapsed, km: segments.at(-1)?.endKm ?? null, stationId: null })
  return out.map((c, index) => ({ ...c, index }))
}

export type RunTimes = Pick<Run, "startedAtUtc" | "arrivals">

const startMs = (run: Pick<Run, "startedAtUtc">) => Date.parse(run.startedAtUtc)

const arrivalTimes = (run: Pick<Run, "arrivals">) =>
  new Map(run.arrivals.map((a) => [a.checkpoint, Date.parse(a.arrivedAtUtc)]))

/** The furthest checkpoint with an arrival; arrivals for checkpoints no longer on the plan are ignored. */
export function lastRecorded(cps: Checkpoint[], run: RunTimes): { index: number; ms: number } | null {
  const at = arrivalTimes(run)
  for (let i = cps.length - 1; i >= 0; i--) {
    const ms = at.get(cps[i].key)
    if (ms !== undefined) return { index: i, ms }
  }
  return null
}

/** The checkpoint after the furthest recorded one; a missed station is not offered again. Null once the finish is in. */
export function nextCheckpoint(cps: Checkpoint[], run: RunTimes): Checkpoint | null {
  return cps[(lastRecorded(cps, run)?.index ?? -1) + 1] ?? null
}

export type TimelineRow = { checkpoint: Checkpoint; plannedMs: number; actualMs: number | null; behindMin: number | null }

/** Planned (actual start + cumulative planned time) against actual for every checkpoint. */
export function timeline(cps: Checkpoint[], run: RunTimes): TimelineRow[] {
  const start = startMs(run)
  const at = arrivalTimes(run)
  return cps.map((checkpoint) => {
    const plannedMs = start + checkpoint.plannedMin * MS_MIN
    const actualMs = at.get(checkpoint.key) ?? null
    return {
      checkpoint,
      plannedMs,
      actualMs,
      behindMin: actualMs === null ? null : Math.round((actualMs - plannedMs) / MS_MIN),
    }
  })
}
